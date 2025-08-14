const { body } = require('express-validator');

exports.validateQuotation = [
  body('projectId')
    .isInt({ min: 1 })
    .withMessage('ID de proyecto inválido'),
  
  body('customerId')
    .isInt({ min: 1 })
    .withMessage('ID de cliente inválido'),
  
  body('companyId')
    .isInt({ min: 1 })
    .withMessage('ID de empresa inválido'),
  
  body('productionZoneId')
    .isInt({ min: 1 })
    .withMessage('ID de zona de producción inválido'),
  
  body('generalExpensesPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje de gastos generales debe estar entre 0 y 100'),
  
  body('profitPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje de utilidad debe estar entre 0 y 100'),
  
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('La tasa de impuesto debe estar entre 0 y 100'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un item en el presupuesto'),
  
  body('items.*.pieceId')
    .isInt({ min: 1 })
    .withMessage('ID de pieza inválido'),
  
  body('items.*.quantity')
    .isFloat({ min: 0.0001 })
    .withMessage('La cantidad debe ser mayor a 0'),
  
  body('mountingItems')
    .optional()
    .isArray()
    .withMessage('Los items de montaje deben ser un arreglo'),
  
  body('mountingItems.*.description')
    .notEmpty()
    .withMessage('La descripción del item de montaje es requerida'),
  
  body('mountingItems.*.unit')
    .notEmpty()
    .withMessage('La unidad del item de montaje es requerida'),
  
  body('mountingItems.*.quantity')
    .isFloat({ min: 0.0001 })
    .withMessage('La cantidad debe ser mayor a 0'),
  
  body('mountingItems.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser mayor o igual a 0')
];