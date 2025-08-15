/**
 * Routes for managing truck types and packing rules
 * 
 * Endpoints:
 * - GET /api/truck-types - Get all truck types
 * - POST /api/truck-types - Create truck type
 * - PUT /api/truck-types/:id - Update truck type
 * - DELETE /api/truck-types/:id - Delete truck type
 * - GET /api/packing-rules - Get packing rules
 * - POST /api/packing-rules - Create packing rule
 * - PUT /api/packing-rules/:id - Update packing rule
 * - DELETE /api/packing-rules/:id - Delete packing rule
 * - GET /api/piece-families - Get piece families
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body, param, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { AppError } = require('../utils/errors');
const { catchAsync } = require('../utils/catchAsync');
const { ApiResponse } = require('../utils/apiResponse');

// Get all truck types
router.get('/', authenticate, catchAsync(async (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      code,
      capacity_tons,
      useful_volume_m3,
      max_length_m,
      max_width_m,
      max_height_m,
      cost_per_trip,
      is_active,
      created_at,
      updated_at
    FROM truck_types
    ORDER BY name
  `;
  
  const result = await executeQuery(query);
  res.json(ApiResponse.success(result));
}));

// Create truck type
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Nombre requerido'),
    body('code').notEmpty().withMessage('Código requerido'),
    body('capacity_tons').isFloat({ min: 0 }).withMessage('Capacidad inválida'),
    body('useful_volume_m3').isFloat({ min: 0 }).withMessage('Volumen inválido')
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Datos inválidos', 400, errors.array());
    }
    
    const {
      name, code, capacity_tons, useful_volume_m3,
      max_length_m, max_width_m, max_height_m,
      cost_per_trip, is_active = true
    } = req.body;
    
    const userId = req.user.id;
    const timestamp = new Date().toISOString();
    
    const query = `
      INSERT INTO truck_types (
        name, code, capacity_tons, useful_volume_m3,
        max_length_m, max_width_m, max_height_m,
        cost_per_trip, is_active,
        created_at, created_by, updated_at, updated_by
      ) VALUES (
        @name, @code, @capacity_tons, @useful_volume_m3,
        @max_length_m, @max_width_m, @max_height_m,
        @cost_per_trip, @is_active,
        @timestamp, @userId, @timestamp, @userId
      );
      SELECT SCOPE_IDENTITY() as id;
    `;
    
    const result = await executeQuery(query, {
      name, code, capacity_tons, useful_volume_m3,
      max_length_m: max_length_m || 0,
      max_width_m: max_width_m || 0,
      max_height_m: max_height_m || 0,
      cost_per_trip: cost_per_trip || 0,
      is_active: is_active ? 1 : 0,
      timestamp, userId
    });
    
    res.status(201).json(ApiResponse.success({
      id: result[0].id,
      name, code
    }, 'Tipo de camión creado'));
  })
);

// Update truck type
router.put('/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isInt().withMessage('ID inválido'),
    body('name').optional().notEmpty().withMessage('Nombre inválido'),
    body('capacity_tons').optional().isFloat({ min: 0 })
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Datos inválidos', 400, errors.array());
    }
    
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    const timestamp = new Date().toISOString();
    
    // Build update query dynamically
    const updateFields = [];
    const params = { id, userId, timestamp };
    
    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        updateFields.push(`${key} = @${key}`);
        params[key] = key === 'is_active' ? (updates[key] ? 1 : 0) : updates[key];
      }
    });
    
    if (updateFields.length === 0) {
      throw new AppError('No hay campos para actualizar', 400);
    }
    
    const query = `
      UPDATE truck_types
      SET ${updateFields.join(', ')},
          updated_at = @timestamp,
          updated_by = @userId
      WHERE id = @id
    `;
    
    await executeQuery(query, params);
    res.json(ApiResponse.success({ id }, 'Tipo de camión actualizado'));
  })
);

// Delete truck type
router.delete('/:id',
  authenticate,
  authorize('admin'),
  [param('id').isInt().withMessage('ID inválido')],
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Check if used in packing rules
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM family_packing_rules
      WHERE truck_type_id = @id
    `;
    
    const check = await executeQuery(checkQuery, { id });
    if (check[0].count > 0) {
      throw new AppError('No se puede eliminar: tipo de camión en uso', 400);
    }
    
    const deleteQuery = `DELETE FROM truck_types WHERE id = @id`;
    await executeQuery(deleteQuery, { id });
    
    res.json(ApiResponse.success(null, 'Tipo de camión eliminado'));
  })
);

// Get packing rules
router.get('/packing-rules', authenticate, catchAsync(async (req, res) => {
  const query = `
    SELECT 
      pr.id,
      pr.family_id,
      pf.name as family_name,
      pr.truck_type_id,
      tt.name as truck_name,
      pr.pieces_per_truck,
      pr.max_layers,
      pr.orientation,
      pr.stacking_allowed,
      pr.notes,
      pr.created_at,
      pr.updated_at
    FROM family_packing_rules pr
    LEFT JOIN piece_families pf ON pr.family_id = pf.id
    LEFT JOIN truck_types tt ON pr.truck_type_id = tt.id
    ORDER BY pf.name, tt.name
  `;
  
  const result = await executeQuery(query);
  res.json(ApiResponse.success(result));
}));

// Create packing rule
router.post('/packing-rules',
  authenticate,
  authorize('admin'),
  [
    body('family_id').isInt().withMessage('Familia requerida'),
    body('truck_type_id').isInt().withMessage('Tipo de camión requerido'),
    body('pieces_per_truck').isInt({ min: 1 }).withMessage('Piezas por camión inválido')
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Datos inválidos', 400, errors.array());
    }
    
    const {
      family_id, truck_type_id, pieces_per_truck,
      max_layers = 1, orientation = 'ANY',
      stacking_allowed = true, notes = ''
    } = req.body;
    
    const userId = req.user.id;
    const timestamp = new Date().toISOString();
    
    // Check if rule already exists
    const checkQuery = `
      SELECT id FROM family_packing_rules
      WHERE family_id = @family_id AND truck_type_id = @truck_type_id
    `;
    
    const existing = await executeQuery(checkQuery, { family_id, truck_type_id });
    if (existing.length > 0) {
      throw new AppError('Ya existe una regla para esta combinación', 400);
    }
    
    const insertQuery = `
      INSERT INTO family_packing_rules (
        family_id, truck_type_id, pieces_per_truck,
        max_layers, orientation, stacking_allowed, notes,
        created_at, created_by, updated_at, updated_by
      ) VALUES (
        @family_id, @truck_type_id, @pieces_per_truck,
        @max_layers, @orientation, @stacking_allowed, @notes,
        @timestamp, @userId, @timestamp, @userId
      );
      SELECT SCOPE_IDENTITY() as id;
    `;
    
    const result = await executeQuery(insertQuery, {
      family_id, truck_type_id, pieces_per_truck,
      max_layers, orientation,
      stacking_allowed: stacking_allowed ? 1 : 0,
      notes, timestamp, userId
    });
    
    res.status(201).json(ApiResponse.success({
      id: result[0].id
    }, 'Regla de empaque creada'));
  })
);

// Update packing rule
router.put('/packing-rules/:id',
  authenticate,
  authorize('admin'),
  [param('id').isInt().withMessage('ID inválido')],
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    const timestamp = new Date().toISOString();
    
    // Build update query
    const updateFields = [];
    const params = { id, userId, timestamp };
    
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'family_id' && key !== 'truck_type_id') {
        updateFields.push(`${key} = @${key}`);
        params[key] = key === 'stacking_allowed' ? (updates[key] ? 1 : 0) : updates[key];
      }
    });
    
    if (updateFields.length === 0) {
      throw new AppError('No hay campos para actualizar', 400);
    }
    
    const query = `
      UPDATE family_packing_rules
      SET ${updateFields.join(', ')},
          updated_at = @timestamp,
          updated_by = @userId
      WHERE id = @id
    `;
    
    await executeQuery(query, params);
    res.json(ApiResponse.success({ id }, 'Regla actualizada'));
  })
);

// Delete packing rule
router.delete('/packing-rules/:id',
  authenticate,
  authorize('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const deleteQuery = `DELETE FROM family_packing_rules WHERE id = @id`;
    await executeQuery(deleteQuery, { id });
    
    res.json(ApiResponse.success(null, 'Regla eliminada'));
  })
);

// Get piece families
router.get('/piece-families', authenticate, catchAsync(async (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      code,
      description,
      is_active
    FROM piece_families
    WHERE is_active = 1
    ORDER BY name
  `;
  
  const result = await executeQuery(query);
  res.json(ApiResponse.success(result));
}));

module.exports = router;