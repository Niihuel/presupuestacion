// src/config/database.js
// Este archivo se encarga de la configuración y conexión a la base de datos SQL Server.
// Proporciona una instancia de Sequelize (ORM) y un pool de conexiones directas a SQL.
const { Sequelize } = require('sequelize');
const { logger } = require('@utilidades');
const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_ENCRYPT,
  DB_TRUST_SERVER_CERTIFICATE,
  DB_INSTANCE,
} = require('./index');

// Configuración de Sequelize para SQL Server
const sequelize = new Sequelize({
  dialect: 'mssql',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  dialectOptions: {
    options: {
      encrypt: DB_ENCRYPT === 'true',
      trustServerCertificate: DB_TRUST_SERVER_CERTIFICATE === 'true',
      enableArithAbort: true,
      instanceName: DB_INSTANCE || undefined,
      typeValidation: false,
      useUTC: false, // Disable UTC to avoid timezone conversion issues
      dateFirst: 1
    }
  },
  timezone: 'local', // Use local timezone
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? 
    (msg) => logger.debug(msg) : false,
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft deletes
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  }
});

// Test connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión a SQL Server establecida correctamente');
    
    // Sync models in development (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('✅ Modelos sincronizados con la base de datos');
    }
  } catch (error) {
    logger.error('❌ Error al conectar con SQL Server:', error.message);
    logger.warn('⚠️ Servidor iniciando sin conexión a base de datos');
    // No lanzar error para permitir que el servidor inicie sin DB
    // throw error;
  }
};

// Alternative: Direct SQL connection without ORM
const sql = require('mssql');

const sqlConfig = {
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  server: DB_HOST,
  port: parseInt(DB_PORT),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: DB_ENCRYPT === 'true',
    trustServerCertificate: DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  }
};

// Create a connection pool
let poolPromise = null;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(sqlConfig);
  }
  return poolPromise;
};

// Execute query helper
const executeQuery = async (query, params = {}) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Add parameters to request
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    logger.error('Error executing query:', error);
    throw error;
  }
};

// Transaction helper
const executeTransaction = async (callback) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB,
  sql,
  getPool,
  executeQuery,
  executeTransaction
};