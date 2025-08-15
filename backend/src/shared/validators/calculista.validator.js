/**
 * Validadores para Calculistas
 * 
 * Define las validaciones para todas las operaciones de calculistas,
 * siguiendo los patrones establecidos en el proyecto.
 */

const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');

/**
 * Validaciones para crear calculista
 */
exports.validateCreateCalculista = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El teléfono no puede tener más de 50 caracteres')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('El teléfono contiene caracteres inválidos'),

  body('specialty')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La especialidad no puede tener más de 255 caracteres'),

  body('license_number')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El número de matrícula no puede tener más de 100 caracteres')
    .matches(/^[A-Z0-9\-]+$/i)
    .withMessage('El número de matrícula solo puede contener letras, números y guiones'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden superar los 1000 caracteres'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('El estado activo debe ser verdadero o falso'),

  handleValidationErrors
];

/**
 * Validaciones para actualizar calculista
 */
exports.validateUpdateCalculista = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de calculista inválido'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El teléfono no puede tener más de 50 caracteres')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('El teléfono contiene caracteres inválidos'),

  body('specialty')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La especialidad no puede tener más de 255 caracteres'),

  body('license_number')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El número de matrícula no puede tener más de 100 caracteres')
    .matches(/^[A-Z0-9\-]+$/i)
    .withMessage('El número de matrícula solo puede contener letras, números y guiones'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden superar los 1000 caracteres'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('El estado activo debe ser verdadero o falso'),

  handleValidationErrors
];
