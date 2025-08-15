// src/utils/index.js

const { AppError, catchAsync } = require('./app.error');
const { logger } = require('./logger');
const ApiResponse = require('./ApiResponse');

/**
 * Función para respuestas exitosas
 */
const successResponse = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  const response = ApiResponse.success(data, message, statusCode);
  return res.status(statusCode).json(response);
};

/**
 * Función para respuestas de error
 */
const errorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';
  const response = ApiResponse.error(message, statusCode, error.errors);
  
  // Log del error
  logger.error('API Error:', {
    message,
    statusCode,
    stack: error.stack
  });
  
  return res.status(statusCode).json(response);
};

module.exports = {
  AppError,
  catchAsync,
  ApiResponse,
  logger,
  successResponse,
  errorResponse
};