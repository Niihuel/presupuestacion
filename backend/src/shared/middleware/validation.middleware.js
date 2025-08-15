// src/middlewares/validation.middleware.js
// Este archivo contiene los middlewares de validación para las diferentes rutas de la aplicación.
const { body, validationResult } = require('express-validator');
const { ApiResponse } = require('@utilidades');

/**
 * @summary Maneja los errores de validación.
 * @description Si hay errores de validación, envía una respuesta 400 con los errores. Si no, pasa al siguiente middleware.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Errores de validación', 400, errors.array());
  }
  next();
};

/**
 * @summary Reglas de validación para el registro de usuarios.
 */
exports.validateRegister = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('username')
    .isLength({ min: 3, max: 30 }).withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos')
    .custom(value => !/\s/.test(value)).withMessage('El nombre de usuario no puede contener espacios'),
  
  body('password')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras'),
  
  body('phone')
    .optional({ checkFalsy: true }) // checkFalsy: true permite valores vacíos y null
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Formato de teléfono inválido'),
  
  handleValidationErrors
];

/**
 * @summary Reglas de validación para el inicio de sesión.
 */
exports.validateLogin = [
  body('username')
    .isLength({ min: 3, max: 30 }).withMessage('Nombre de usuario inválido')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Nombre de usuario inválido'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
  
  handleValidationErrors
];

/**
 * @summary Reglas de validación para el campo de correo electrónico.
 */
exports.validateEmail = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  handleValidationErrors
];

/**
 * @summary Reglas de validación para el campo de contraseña.
 */
exports.validatePassword = [
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden'),
  
  body('token')
    .notEmpty().withMessage('Token es requerido'),
  
  handleValidationErrors
];

/**
 * Password change validation rules
 */
exports.validatePasswordChange = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('La nueva contraseña debe ser diferente a la actual'),
  
  body('confirmNewPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Las contraseñas no coinciden'),
  
  handleValidationErrors
];

/**
 * Profile update validation rules
 */
exports.validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras'),
  
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Formato de teléfono inválido'),
  
  handleValidationErrors
];

/**
 * Generic ID validation
 */
exports.validateId = (paramName = 'id') => [
  body(paramName)
    .isInt({ min: 1 }).withMessage('ID inválido'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
exports.validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Página debe ser un número mayor a 0'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Límite debe ser un número entre 1 y 100'),
  
  body('sortBy')
    .optional()
    .matches(/^[a-zA-Z_]+$/).withMessage('Campo de ordenamiento inválido'),
  
  body('sortOrder')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Orden debe ser asc o desc'),
  
  handleValidationErrors
];

/**
 * Search validation
 */
exports.validateSearch = [
  body('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('La búsqueda debe tener entre 1 y 100 caracteres')
    .escape(), // Prevent XSS
  
  handleValidationErrors
];

/**
 * Date range validation
 */
exports.validateDateRange = [
  body('startDate')
    .optional()
    .isISO8601().withMessage('Fecha de inicio inválida'),
  
  body('endDate')
    .optional()
    .isISO8601().withMessage('Fecha de fin inválida')
    .custom((value, { req }) => {
      if (req.body.startDate && value) {
        return new Date(value) >= new Date(req.body.startDate);
      }
      return true;
    }).withMessage('La fecha de fin debe ser posterior a la fecha de inicio'),
  
  handleValidationErrors
];

/**
 * Create custom validation middleware
 */
exports.createValidation = (rules) => {
  return [...rules, handleValidationErrors];
};

/**
 * Export handleValidationErrors for use in custom validators
 */
exports.handleValidationErrors = handleValidationErrors;