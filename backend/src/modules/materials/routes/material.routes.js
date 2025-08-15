/**
 * Rutas de Materiales
 * 
 * Define todas las rutas HTTP para el módulo de materiales
 */

const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const pieceMaterialFormulaController = require('../controllers/pieceMaterialFormula.controller');
const { authenticate } = require('../../../shared/middleware/auth.middleware');
const { handleValidationErrors } = require('../../../shared/middleware/validation.middleware');
const { body, param, query } = require('express-validator');
const { executeQuery } = require('../../../shared/database/database');

// Middleware de autenticación para todas las rutas
router.use(authenticate);
// Generar código de material
router.get('/generate-code', (req, res) => materialController.generateMaterialCode(req, res));

// Función de validación simplificada
const validateRequest = handleValidationErrors;

// Validaciones comunes
const validateMaterialId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de material debe ser un entero positivo')
];

const validatePlantId = [
  param('plantId')
    .isInt({ min: 1 })
    .withMessage('ID de planta debe ser un entero positivo')
];

const validatePieceId = [
  param('pieceId')
    .isInt({ min: 1 })
    .withMessage('ID de pieza debe ser un entero positivo')
];

const validateMaterialCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nombre es requerido y debe tener máximo 255 caracteres'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Código es requerido y debe tener máximo 50 caracteres'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Categoría es requerida y debe tener máximo 100 caracteres'),
  body('unit')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unidad es requerida y debe tener máximo 20 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descripción debe tener máximo 1000 caracteres'),
  body('specifications')
    .optional()
    .isObject()
    .withMessage('Especificaciones debe ser un objeto JSON'),
  body('minimumStock')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Stock mínimo debe ser un número positivo'),
  body('suppliers')
    .optional()
    .isArray()
    .withMessage('Proveedores debe ser un arreglo'),
  body('plantPrices')
    .optional()
    .isObject()
    .withMessage('Precios por planta debe ser un objeto'),
  body('plantStocks')
    .optional()
    .isObject()
    .withMessage('Stock por planta debe ser un objeto')
];

const validateMaterialUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nombre debe tener máximo 255 caracteres'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Código debe tener máximo 50 caracteres'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Categoría debe tener máximo 100 caracteres'),
  body('unit')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unidad debe tener máximo 20 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descripción debe tener máximo 1000 caracteres'),
  body('specifications')
    .optional()
    .isObject()
    .withMessage('Especificaciones debe ser un objeto JSON'),
  body('minimumStock')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Stock mínimo debe ser un número positivo'),
  body('suppliers')
    .optional()
    .isArray()
    .withMessage('Proveedores debe ser un arreglo'),
  body('plantPrices')
    .optional()
    .isObject()
    .withMessage('Precios por planta debe ser un objeto'),
  body('plantStocks')
    .optional()
    .isObject()
    .withMessage('Stock por planta debe ser un objeto'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser un valor booleano')
];

const validateStockUpdate = [
  body('type')
    .isIn(['IN', 'OUT', 'ADJUSTMENT'])
    .withMessage('Tipo debe ser IN, OUT o ADJUSTMENT'),
  body('quantity')
    .isFloat({ min: 0 })
    .withMessage('Cantidad debe ser un número positivo'),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Razón es requerida y debe tener máximo 255 caracteres'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notas debe tener máximo 500 caracteres')
];

const validatePriceUpdate = [
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Precio debe ser un número positivo'),
  body('supplierId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de proveedor debe ser un entero positivo'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Fecha de validez debe ser una fecha válida'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notas debe tener máximo 500 caracteres')
];

const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un entero entre 1 y 100')
];

const validateSearchQuery = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Query de búsqueda debe tener entre 2 y 100 caracteres')
];

// RUTAS PRINCIPALES

/**
 * GET /api/materials
 * Obtener lista de materiales con filtros y paginación
 */
router.get('/', 
  validatePaginationQuery,
  validateRequest,
  materialController.getMaterials
);

/**
 * GET /api/materials/stats
 * Obtener estadísticas de materiales
 */
router.get('/stats', 
  materialController.getMaterialsStats
);

/**
 * GET /api/materials/categories
 * Obtener categorías disponibles
 */
router.get('/categories', 
  materialController.getMaterialCategories
);

/**
 * GET /api/materials/units
 * Obtener unidades de medida disponibles
 */
router.get('/units', 
  materialController.getMaterialUnits
);

/**
 * GET /api/materials/search
 * Búsqueda rápida de materiales
 */
router.get('/search', 
  validateSearchQuery,
  validateRequest,
  materialController.searchMaterials
);

/**
 * GET /api/materials/low-stock
 * Obtener materiales con stock bajo
 */
router.get('/low-stock', 
  materialController.getLowStockMaterials
);

/**
 * GET /api/materials/out-of-stock
 * Obtener materiales sin stock
 */
router.get('/out-of-stock', 
  materialController.getOutOfStockMaterials
);

/**
 * POST /api/materials
 * Crear un nuevo material
 */
router.post('/', 
  validateMaterialCreation,
  validateRequest,
  materialController.createMaterial
);

/**
 * GET /api/materials/:id
 * Obtener un material específico
 */
router.get('/:id', 
  validateMaterialId,
  validateRequest,
  materialController.getMaterial
);

/**
 * PUT /api/materials/:id
 * Actualizar un material existente
 */
router.put('/:id', 
  validateMaterialId,
  validateMaterialUpdate,
  validateRequest,
  materialController.updateMaterial
);

/**
 * DELETE /api/materials/:id
 * Eliminar un material (soft delete)
 */
router.delete('/:id', 
  validateMaterialId,
  validateRequest,
  materialController.deleteMaterial
);

/**
 * GET /api/materials/:id/price-history
 * Obtener historial de precios de un material
 */
router.get('/:id/price-history', 
  validateMaterialId,
  validateRequest,
  materialController.getMaterialPriceHistory
);

/**
 * GET /api/materials/:id/stock-by-plant
 * Obtener stock de un material por planta
 */
router.get('/:id/stock-by-plant', 
  validateMaterialId,
  validateRequest,
  materialController.getMaterialStockByPlant
);

/**
 * PUT /api/materials/:id/stock/:plantId
 * Actualizar stock de un material en una planta
 */
router.put('/:id/stock/:plantId', 
  validateMaterialId,
  validatePlantId,
  validateStockUpdate,
  validateRequest,
  materialController.updateMaterialStock
);

/**
 * PUT /api/materials/:id/price/:plantId
 * Actualizar precio de un material en una planta
 */
router.put('/:id/price/:plantId', 
  validateMaterialId,
  validatePlantId,
  validatePriceUpdate,
  validateRequest,
  materialController.updateMaterialPrice
);

// RUTAS RELACIONADAS CON PIEZAS

/**
 * POST /api/pieces/:pieceId/calculate-material-cost
 * Calcular costo de materiales para una pieza
 */
router.post('/pieces/:pieceId/calculate-material-cost', 
  validatePieceId,
  [
    body('plantId')
      .isInt({ min: 1 })
      .withMessage('ID de planta es requerido y debe ser un entero positivo'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Cantidad debe ser un entero positivo')
  ],
  validateRequest,
  materialController.calculatePieceMaterialCost
);

/**
 * POST /api/pieces/:pieceId/check-material-availability
 * Verificar disponibilidad de materiales para una pieza
 */
router.post('/pieces/:pieceId/check-material-availability', 
  validatePieceId,
  [
    body('plantId')
      .isInt({ min: 1 })
      .withMessage('ID de planta es requerido y debe ser un entero positivo'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Cantidad debe ser un entero positivo')
  ],
  validateRequest,
  materialController.checkMaterialAvailability
);

// ===========================================
// RUTAS DE FÓRMULAS DE MATERIALES POR PIEZA
// ===========================================

/**
 * GET /api/pieces/:pieceId/materials-formula
 * Obtener fórmula de materiales de una pieza
 */
router.get('/pieces/:pieceId/materials-formula', 
  validatePieceId,
  validateRequest,
  pieceMaterialFormulaController.getPieceFormula
);

/**
 * PUT /api/pieces/:pieceId/materials-formula
 * Actualizar fórmula completa de una pieza
 */
router.put('/pieces/:pieceId/materials-formula', 
  validatePieceId,
  [
    body('materials')
      .isArray()
      .withMessage('Debe ser un array de materiales'),
    body('materials.*.materialId')
      .isInt({ min: 1 })
      .withMessage('ID de material es requerido'),
    body('materials.*.quantityPerUnit')
      .isFloat({ min: 0.01 })
      .withMessage('Cantidad por unidad debe ser mayor a 0'),
    body('materials.*.wasteFactor')
      .optional()
      .isFloat({ min: 1.0 })
      .withMessage('Factor de desperdicio debe ser mayor o igual a 1.0')
  ],
  validateRequest,
  pieceMaterialFormulaController.updatePieceFormula
);

/**
 * POST /api/pieces/:pieceId/materials-formula/material
 * Agregar material individual a la fórmula
 */
router.post('/pieces/:pieceId/materials-formula/material', 
  validatePieceId,
  [
    body('materialId')
      .isInt({ min: 1 })
      .withMessage('ID de material es requerido'),
    body('quantityPerUnit')
      .isFloat({ min: 0.01 })
      .withMessage('Cantidad por unidad debe ser mayor a 0'),
    body('wasteFactor')
      .optional()
      .isFloat({ min: 1.0 })
      .withMessage('Factor de desperdicio debe ser mayor o igual a 1.0')
  ],
  validateRequest,
  pieceMaterialFormulaController.addMaterialToFormula
);

/**
 * DELETE /api/pieces/:pieceId/materials-formula/material/:materialId
 * Remover material de la fórmula
 */
router.delete('/pieces/:pieceId/materials-formula/material/:materialId', 
  validatePieceId,
  validateMaterialId,
  validateRequest,
  pieceMaterialFormulaController.removeMaterialFromFormula
);

/**
 * POST /api/pieces/:pieceId/materials-formula/validate
 * Validar fórmula de materiales
 */
router.post('/pieces/:pieceId/materials-formula/validate', 
  validatePieceId,
  [
    body('materials')
      .isArray()
      .withMessage('Debe ser un array de materiales')
  ],
  validateRequest,
  pieceMaterialFormulaController.validateFormula
);

/**
 * POST /api/pieces/:sourceId/materials-formula/copy/:targetId
 * Copiar fórmula de una pieza a otra
 */
router.post('/pieces/:sourceId/materials-formula/copy/:targetId', 
  [
    param('sourceId')
      .isInt({ min: 1 })
      .withMessage('ID de pieza origen debe ser un entero positivo'),
    param('targetId')
      .isInt({ min: 1 })
      .withMessage('ID de pieza destino debe ser un entero positivo')
  ],
  validateRequest,
  pieceMaterialFormulaController.copyFormula
);

/**
 * GET /api/pieces/:pieceId/materials-formula/similar
 * Buscar fórmulas similares
 */
router.get('/pieces/:pieceId/materials-formula/similar', 
  validatePieceId,
  validateRequest,
  pieceMaterialFormulaController.findSimilarFormulas
);

/**
 * GET /api/materials/usage-stats
 * Obtener estadísticas de uso de materiales
 */
router.get('/materials/usage-stats', 
  pieceMaterialFormulaController.getMaterialUsageStats
);

/**
 * GET /api/materials/:materialId/pieces
 * Obtener piezas que usan un material específico
 */
router.get('/materials/:materialId/pieces', 
  validateMaterialId,
  validateRequest,
  pieceMaterialFormulaController.getPiecesUsingMaterial
);

// ==============================
// PRECIOS VIGENTES DE INSUMOS
// ==============================

/**
 * GET /api/v1/materials/prices?vigentes&zone_id&as_of
 */
router.get('/prices',
  [
    query('zone_id').optional().isInt({ min: 1 }),
    query('as_of').optional().isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const zoneId = parseInt(req.query.zone_id) || null;
      const asOf = req.query.as_of || null;
      if (!zoneId) return res.status(400).json({ success: false, message: 'zone_id requerido' });
      const sql = `
        DECLARE @as_of_date DATE = COALESCE(@as_of, CAST(GETDATE() AS DATE));
        DECLARE @month_start DATE = DATEFROMPARTS(YEAR(@as_of_date), MONTH(@as_of_date), 1);
        DECLARE @month_end DATE = EOMONTH(@as_of_date);
        ;WITH current_month AS (
          SELECT material_id, price AS price_current
          FROM dbo.material_plant_prices
          WHERE zone_id = @zone_id AND is_active = 1
            AND valid_from <= @as_of_date
            AND (valid_until IS NULL OR valid_until >= @as_of_date)
        ), prev_month AS (
          SELECT mpp.material_id, mpp.price AS price_prev
          FROM dbo.material_plant_prices mpp
          WHERE mpp.zone_id = @zone_id
            AND mpp.valid_from BETWEEN DATEADD(MONTH, -1, @month_start) AND EOMONTH(DATEADD(MONTH, -1, @month_start))
        )
        SELECT cm.material_id, cm.price_current, pm.price_prev,
               CASE WHEN pm.price_prev IS NULL OR pm.price_prev = 0 THEN NULL
                    ELSE (cm.price_current / pm.price_prev) - 1 END AS delta_percent
        FROM current_month cm
        LEFT JOIN prev_month pm ON pm.material_id = cm.material_id
        ORDER BY cm.material_id;`;
      const result = await executeQuery(sql, { zone_id: zoneId, as_of: asOf });
      res.json({ success: true, data: result?.recordset || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * POST /api/v1/materials/prices (crear/actualizar vigencia)
 */
router.post('/prices',
  [
    body('material_id').isInt({ min: 1 }),
    body('zone_id').isInt({ min: 1 }),
    body('price').isFloat({ min: 0 }),
    body('valid_from').optional().isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { material_id, zone_id, price, valid_from } = req.body;
      const sql = `
        DECLARE @material_id INT = @p_material_id, @zone_id INT = @p_zone_id,
                @price DECIMAL(18,2) = @p_price,
                @vf DATE = COALESCE(@p_valid_from, CAST(GETDATE() AS DATE));
        UPDATE dbo.material_plant_prices
        SET valid_until = DATEADD(DAY, -1, @vf)
        WHERE material_id = @material_id AND zone_id = @zone_id AND is_active = 1
          AND valid_from <= @vf AND (valid_until IS NULL OR valid_until >= @vf);
        INSERT INTO dbo.material_plant_prices(material_id, zone_id, price, valid_from, valid_until, is_active)
        VALUES (@material_id, @zone_id, @price, @vf, NULL, 1);
        SELECT SCOPE_IDENTITY() AS id;`;
      const result = await executeQuery(sql, {
        p_material_id: material_id,
        p_zone_id: zone_id,
        p_price: price,
        p_valid_from: valid_from || null
      });
      res.status(201).json({ success: true, id: result?.recordset?.[0]?.id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * POST /api/v1/materials/prices/close-month (ejecuta SP)
 */
router.post('/prices/close-month',
  [
    body('zone_id').isInt({ min: 1 }),
    body('month_date').isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { zone_id, month_date } = req.body;
      const sql = 'EXEC dbo.SP_close_material_prices_month @zone_id, @month_date';
      const result = await executeQuery(sql, { zone_id, month_date });
      res.json({ success: true, data: result?.recordset || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ==============================
// WHERE USED Y ANÁLISIS DE IMPACTO
// ==============================

/**
 * GET /api/materials/:id/where-used
 * Obtener piezas que utilizan este material (BOM / Factor fundamental)
 */
router.get('/:id/where-used',
  validateMaterialId,
  [
    query('zone_id').isInt({ min: 1 }).withMessage('zone_id es requerido'),
    query('month_date').optional().isISO8601().withMessage('month_date debe ser una fecha válida')
  ],
  validateRequest,
  materialController.getWhereUsed
);

/**
 * POST /api/materials/recalculate-impact
 * Recalcular impacto de cambios de precio en piezas
 */
router.post('/recalculate-impact',
  [
    body('material_id').isInt({ min: 1 }).withMessage('material_id es requerido'),
    body('zone_id').isInt({ min: 1 }).withMessage('zone_id es requerido'),
    body('month_date').optional().isISO8601().withMessage('month_date debe ser una fecha válida')
  ],
  validateRequest,
  materialController.recalculateImpact
);

/**
 * POST /api/materials/import-csv
 * Importar precios de materiales desde CSV
 */
router.post('/import-csv',
  [
    body('zone_id').isInt({ min: 1 }).withMessage('zone_id es requerido'),
    body('month_date').isISO8601().withMessage('month_date es requerido'),
    body('data').isArray().withMessage('data debe ser un array de registros CSV')
  ],
  validateRequest,
  materialController.importFromCSV
);

/**
 * GET /api/materials/export-csv
 * Exportar precios de materiales a CSV
 */
router.get('/export-csv',
  [
    query('zone_id').isInt({ min: 1 }).withMessage('zone_id es requerido'),
    query('month_date').optional().isISO8601().withMessage('month_date debe ser una fecha válida')
  ],
  validateRequest,
  materialController.exportToCSV
);

/**
 * POST /api/materials/close-month
 * Cerrar mes para precios de materiales (mejorado)
 */
router.post('/close-month',
  [
    body('zone_id').isInt({ min: 1 }).withMessage('zone_id es requerido'),
    body('month_date').isISO8601().withMessage('month_date es requerido')
  ],
  validateRequest,
  materialController.closeMonth
);

module.exports = router;
