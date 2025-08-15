// src/utils/appError.js
// Este archivo contiene la clase de error personalizada, un manejador de errores asíncronos y un formateador de respuestas API.

/**
 * @summary Clase de error personalizada para la aplicación.
 * @description Extiende la clase Error para incluir un código de estado y un estado.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * @summary Envoltorio para el manejo de errores en funciones asíncronas.
 * @description Captura los errores en las promesas y los pasa a `next()`.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * @summary Formateador de respuestas de la API.
 * @description Proporciona métodos estáticos para enviar respuestas de éxito, error y paginadas.
 */
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  static paginated(res, data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  }
}

/**
 * @summary Manejador de errores de la base de datos.
 * @description Convierte los errores de la base de datos en instancias de AppError con mensajes amigables para el usuario.
 */
const handleDatabaseError = (error) => {
  // Sequelize validation error
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return new AppError('Error de validación', 400);
  }

  // Sequelize unique constraint error
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0].path;
    return new AppError(`El ${field} ya está en uso`, 400);
  }

  // SQL Server specific errors
  if (error.number) {
    switch (error.number) {
      case 2627: // Unique constraint violation
        return new AppError('El registro ya existe', 400);
      case 547: // Foreign key constraint violation
        return new AppError('No se puede eliminar el registro porque tiene dependencias', 400);
      case 2601: // Duplicate key
        return new AppError('Clave duplicada', 400);
      default:
        return new AppError('Error en la base de datos', 500);
    }
  }

  return error;
};

module.exports = {
  AppError,
  catchAsync,
  ApiResponse,
  handleDatabaseError
};