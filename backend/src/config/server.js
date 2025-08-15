// src/config/server.js
require('module-alias/register');
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('../shared/database/database');
const { logger } = require('../shared/utils/logger');
const { errorHandler } = require('../shared/middleware/error.handler');

// Import routes desde agregador en español, mapeando a nombres actuales
const {
	rutasAuth: authRoutes,
	rutasCotizaciones: quotationRoutes,
	rutasZonas: zoneRoutes,
	rutasClientes: customerRoutes,
	rutasProyectos: projectRoutes,
	rutasPiezas: pieceRoutes,
	rutasTablero: dashboardRoutes,
	rutasSistema: systemRoutes,
	rutasMateriales: materialRoutes,
	rutasAdmin: adminRoutes,
	rutasLogistica: logisticsRoutes,
	rutasCalculistas: calculistaRoutes,
	rutasPlantas: plantasRoutes,
	rutasPoliticas,
	rutasTiposCamion
} = require('../modulos');

// Import passport strategies  
require('../modules/auth/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Configuración para producción sin nginx
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174', 
  'http://127.0.0.1:3001'
];

// Add CLIENT_URL from env if exists
if (process.env.CLIENT_URL) {
  const clientUrls = process.env.CLIENT_URL.split(',').map(url => url.trim()).filter(Boolean);
  allowedOrigins.push(...clientUrls);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests, or OAuth callbacks)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = `CORS Error: Origen no permitido: ${origin}. Orígenes permitidos: ${allowedOrigins.join(', ')}`;
    logger.error(msg);
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
}));

// Basic middlewares
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Initialize Passport
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all routes
app.use('/api/', limiter);

// Stricter rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: (process.env.LOGIN_ATTEMPTS_WINDOW || 15) * 60 * 1000,
  max: process.env.LOGIN_ATTEMPTS_MAX || 5,
  message: 'Demasiados intentos de inicio de sesión, por favor intente nuevamente más tarde.',
  skipSuccessfulRequests: true,
});

// Health check endpoint
app.get('/health', (req, res) => {
  const os = require('os');
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsage = Math.round(((memTotal - memFree) / memTotal) * 100);
  // CPU load promedio 1m
  const load = os.loadavg?.()[0] || 0;
  const cpuCount = os.cpus()?.length || 1;
  const cpuUsage = Math.min(100, Math.round((load / cpuCount) * 100));
  // Espacio en disco usando node-disk-info
  let diskUsage = 0;
  try {
    const { getDiskInfoSync } = require('node-disk-info');
    const disks = getDiskInfoSync();
    // Tomar la partición del sistema (primera) y calcular uso global promedio
    if (disks && disks.length) {
      const total = disks.reduce((a, d) => a + Number(d.blocks) * 1024, 0);
      const used = disks.reduce((a, d) => a + (Number(d.used) || (Number(d.blocks) - Number(d.available))) * 1024, 0);
      diskUsage = total > 0 ? Math.round((used / total) * 100) : 0;
    }
  } catch (_) {}

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    metrics: {
      cpu_usage: cpuUsage,
      memory_usage: memUsage,
      disk_usage: diskUsage
    }
  });
});

// Test endpoint para debugging
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    port: PORT,
    env: process.env.NODE_ENV
  });
});

// Endpoint específico para test de conexión
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'Conexión exitosa con la API v1',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    headers: {
      'Access-Control-Allow-Origin': req.get('Origin'),
      'Access-Control-Allow-Credentials': 'true'
    }
  });
});

// API routes - Nueva estructura modular
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/zones', zoneRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/pieces', pieceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/calculistas', calculistaRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/plantas', plantasRoutes);
app.use('/api/v1', systemRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', logisticsRoutes);
app.use('/api/v1/politicas', rutasPoliticas);
app.use('/api/v1/tipos-camion', rutasTiposCamion);

// Rutas en español (alias)
app.use('/api/v1/autenticacion', authRoutes);
app.use('/api/v1/cotizaciones', quotationRoutes);
app.use('/api/v1/zonas', zoneRoutes);
app.use('/api/v1/clientes', customerRoutes);
app.use('/api/v1/proyectos', projectRoutes);
app.use('/api/v1/piezas', pieceRoutes);
app.use('/api/v1/tablero', dashboardRoutes);
app.use('/api/v1/sistema', systemRoutes);
app.use('/api/v1/materiales', materialRoutes);
app.use('/api/v1/administracion', adminRoutes);
app.use('/api/v1/logistica', logisticsRoutes);


// Ruta temporal para testing de clientes
app.use('/api/v1/customers-test', require('../modules/customers/routes/customer.test.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    const server = app.listen(PORT, () => {
      logger.info(`Servidor corriendo en puerto ${PORT}`);
      logger.info(`Entorno: ${process.env.NODE_ENV}`);
      logger.info(`URL: http://localhost:${PORT}`);
      logger.info(`Cliente permitido: ${process.env.CLIENT_URL}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...');
      logger.error(err);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated!');
      });
    });

  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Export app for testing
module.exports = app;

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  startServer();
}