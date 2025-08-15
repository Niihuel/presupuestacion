const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../shared/middleware/auth.middleware');
const { body, param, validationResult } = require('express-validator');
const { executeQuery } = require('../../../shared/database/database');
const { AppError, catchAsync, ApiResponse } = require('../../../shared/utils');

// Tipos de camión
router.get('/', authenticate, catchAsync(async (req, res) => {
  const result = await executeQuery(`
    SELECT id, name, code, capacity_tons, useful_volume_m3,
           max_length_m, max_width_m, max_height_m, cost_per_trip,
           is_active, created_at, updated_at
    FROM truck_types
    ORDER BY name
  `);
  res.json(ApiResponse.success(result));
}));

router.post('/', authenticate, authorize('admin'), [
  body('name').notEmpty(),
  body('code').notEmpty(),
  body('capacity_tons').isFloat({ min: 0 }),
  body('useful_volume_m3').isFloat({ min: 0 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Datos inválidos', 400, errors.array());
  const {
    name, code, capacity_tons, useful_volume_m3,
    max_length_m = 0, max_width_m = 0, max_height_m = 0,
    cost_per_trip = 0, is_active = true
  } = req.body;
  const userId = req.user.id; const timestamp = new Date().toISOString();
  const result = await executeQuery(`
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
    ); SELECT SCOPE_IDENTITY() as id;`, {
    name, code, capacity_tons, useful_volume_m3,
    max_length_m, max_width_m, max_height_m,
    cost_per_trip, is_active: is_active ? 1 : 0,
    timestamp, userId
  });
  res.status(201).json(ApiResponse.success({ id: result[0].id, name, code }, 'Tipo de camión creado'));
}));

router.put('/:id', authenticate, authorize('admin'), [
  param('id').isInt(),
  body('name').optional().notEmpty(),
  body('capacity_tons').optional().isFloat({ min: 0 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Datos inválidos', 400, errors.array());
  const { id } = req.params; const updates = req.body;
  const userId = req.user.id; const timestamp = new Date().toISOString();
  const updateFields = []; const params = { id, userId, timestamp };
  Object.keys(updates).forEach(key => { if (key !== 'id') { updateFields.push(`${key} = @${key}`); params[key] = key === 'is_active' ? (updates[key] ? 1 : 0) : updates[key]; }});
  if (updateFields.length === 0) throw new AppError('No hay campos para actualizar', 400);
  await executeQuery(`
    UPDATE truck_types SET ${updateFields.join(', ')}, updated_at = @timestamp, updated_by = @userId
    WHERE id = @id
  `, params);
  res.json(ApiResponse.success({ id }, 'Tipo de camión actualizado'));
}));

router.delete('/:id', authenticate, authorize('admin'), [param('id').isInt()], catchAsync(async (req, res) => {
  const { id } = req.params;
  const check = await executeQuery(`SELECT COUNT(*) as count FROM family_packing_rules WHERE truck_type_id = @id`, { id });
  if (check[0].count > 0) throw new AppError('No se puede eliminar: tipo de camión en uso', 400);
  await executeQuery('DELETE FROM truck_types WHERE id = @id', { id });
  res.json(ApiResponse.success(null, 'Tipo de camión eliminado'));
}));

// Reglas de empaque
router.get('/packing-rules', authenticate, catchAsync(async (req, res) => {
  const result = await executeQuery(`
    SELECT pr.id, pr.family_id, pf.name as family_name,
           pr.truck_type_id, tt.name as truck_name,
           pr.pieces_per_truck, pr.max_layers, pr.orientation,
           pr.stacking_allowed, pr.notes, pr.created_at, pr.updated_at
    FROM family_packing_rules pr
    LEFT JOIN piece_families pf ON pr.family_id = pf.id
    LEFT JOIN truck_types tt ON pr.truck_type_id = tt.id
    ORDER BY pf.name, tt.name
  `);
  res.json(ApiResponse.success(result));
}));

router.post('/packing-rules', authenticate, authorize('admin'), [
  body('family_id').isInt(),
  body('truck_type_id').isInt(),
  body('pieces_per_truck').isInt({ min: 1 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Datos inválidos', 400, errors.array());
  const { family_id, truck_type_id, pieces_per_truck, max_layers = 1, orientation = 'ANY', stacking_allowed = true, notes = '' } = req.body;
  const userId = req.user.id; const timestamp = new Date().toISOString();
  const existing = await executeQuery('SELECT id FROM family_packing_rules WHERE family_id = @family_id AND truck_type_id = @truck_type_id', { family_id, truck_type_id });
  if (existing.length > 0) throw new AppError('Ya existe una regla para esta combinación', 400);
  const result = await executeQuery(`
    INSERT INTO family_packing_rules (
      family_id, truck_type_id, pieces_per_truck,
      max_layers, orientation, stacking_allowed, notes,
      created_at, created_by, updated_at, updated_by
    ) VALUES (
      @family_id, @truck_type_id, @pieces_per_truck,
      @max_layers, @orientation, @stacking_allowed, @notes,
      @timestamp, @userId, @timestamp, @userId
    ); SELECT SCOPE_IDENTITY() as id;`, {
    family_id, truck_type_id, pieces_per_truck, max_layers, orientation,
    stacking_allowed: stacking_allowed ? 1 : 0, notes, timestamp, userId
  });
  res.status(201).json(ApiResponse.success({ id: result[0].id }, 'Regla de empaque creada'));
}));

router.put('/packing-rules/:id', authenticate, authorize('admin'), [param('id').isInt()], catchAsync(async (req, res) => {
  const { id } = req.params; const updates = req.body; const userId = req.user.id; const timestamp = new Date().toISOString();
  const updateFields = []; const params = { id, userId, timestamp };
  Object.keys(updates).forEach(key => { if (!['id','family_id','truck_type_id'].includes(key)) { updateFields.push(`${key} = @${key}`); params[key] = key === 'stacking_allowed' ? (updates[key] ? 1 : 0) : updates[key]; }});
  if (updateFields.length === 0) throw new AppError('No hay campos para actualizar', 400);
  await executeQuery(`
    UPDATE family_packing_rules SET ${updateFields.join(', ')}, updated_at = @timestamp, updated_by = @userId
    WHERE id = @id
  `, params);
  res.json(ApiResponse.success({ id }, 'Regla actualizada'));
}));

router.delete('/packing-rules/:id', authenticate, authorize('admin'), catchAsync(async (req, res) => {
  const { id } = req.params;
  await executeQuery('DELETE FROM family_packing_rules WHERE id = @id', { id });
  res.json(ApiResponse.success(null, 'Regla eliminada'));
}));

router.get('/piece-families', authenticate, catchAsync(async (req, res) => {
  const result = await executeQuery('SELECT id, name, code, description, is_active FROM piece_families WHERE is_active = 1 ORDER BY name');
  res.json(ApiResponse.success(result));
}));

module.exports = router;