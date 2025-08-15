// src/utils/logger.js
// Este archivo configura el sistema de registro (logging) de la aplicación utilizando la librería Winston.
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
  
  // Error file transport
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined file transport
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create stream for Morgan
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Helper functions for structured logging
const logInfo = (message, meta = {}) => {
  logger.info(message, { ...meta, timestamp: new Date().toISOString() });
};

const logError = (message, error = null, meta = {}) => {
  const errorMeta = error ? {
    error: {
      message: error.message,
      stack: error.stack,
      ...error
    }
  } : {};
  
  logger.error(message, { ...meta, ...errorMeta, timestamp: new Date().toISOString() });
};

const logWarn = (message, meta = {}) => {
  logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
};

const logDebug = (message, meta = {}) => {
  logger.debug(message, { ...meta, timestamp: new Date().toISOString() });
};

const logHttp = (message, meta = {}) => {
  logger.http(message, { ...meta, timestamp: new Date().toISOString() });
};

// Audit logging for important actions
const logAudit = (userId, action, entityType, entityId, details = {}) => {
  const auditEntry = {
    userId,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown'
  };
  
  // Log to specific audit file
  const auditLogger = winston.createLogger({
    format: winston.format.json(),
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, 'audit.log'),
        maxsize: 10485760, // 10MB
        maxFiles: 10,
      })
    ]
  });
  
  auditLogger.info('AUDIT', auditEntry);
  logger.info(`AUDIT: ${action} on ${entityType} ${entityId} by user ${userId}`);
};

// Performance logging
const logPerformance = (operation, duration, details = {}) => {
  const perfEntry = {
    operation,
    duration,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (duration > 1000) { // Log as warning if operation takes more than 1 second
    logger.warn(`SLOW OPERATION: ${operation} took ${duration}ms`, perfEntry);
  } else {
    logger.debug(`PERFORMANCE: ${operation} took ${duration}ms`, perfEntry);
  }
};

module.exports = {
  logger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logHttp,
  logAudit,
  logPerformance
};