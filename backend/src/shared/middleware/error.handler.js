// src/middlewares/errorHandler.js
// Este archivo contiene el middleware global para el manejo de errores.
const { AppError, handleDatabaseError, catchAsync } = require('@utilidades/app.error');
const { logError } = require('@utilidades/logger');

/**
 * @summary Middleware global para el manejo de errores.
 * @description Captura todos los errores de la aplicación, los registra y envía una respuesta de error estandarizada.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logError(`Error: ${error.message}`, err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id
  });

  // Handle database errors
  if (err.name && err.name.includes('Sequelize')) {
    error = handleDatabaseError(err);
  }

  // SQL Server errors
  if (err.number) {
    error = handleDatabaseError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(message, 400);
  }

  // Cast errors
  if (err.name === 'CastError') {
    error = new AppError('Parámetro inválido', 400);
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('Archivo demasiado grande', 400);
    } else {
      error = new AppError('Error al subir archivo', 400);
    }
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        error: err
      })
    }
  });
};

/**
 * @summary Manejador para rutas no encontradas (404).
 * @description Crea un error 404 y lo pasa al siguiente middleware de manejo de errores.
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Ruta no encontrada - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
  catchAsync  // Usar catchAsync en lugar de asyncHandler duplicado
};