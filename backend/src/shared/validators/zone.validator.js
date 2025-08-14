const { body } = require('express-validator');

exports.validateZone = [
  body('code')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('El código debe tener entre 2 y 10 caracteres')
    .matches(/^[A-Z0-9_]+$/i)
    .withMessage('El código solo puede contener letras, números y guiones bajos'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar los 100 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La descripción no puede superar los 255 caracteres'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La ciudad no puede superar los 100 caracteres'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El estado/provincia no puede superar los 100 caracteres')
];

exports.validateZonePrices = [
  body('prices')
    .isArray({ min: 1 })
    .withMessage('Debe proporcionar al menos un precio'),
  
  body('prices.*.pieceId')
    .isInt({ min: 1 })
    .withMessage('ID de pieza inválido'),
  
  body('prices.*.basePrice')
    .isFloat({ min: 0 })
    .withMessage('El precio base debe ser mayor o igual a 0'),
  
  body('prices.*.adjustment')
    .optional()
    .isFloat()
    .withMessage('El ajuste debe ser un número')
];