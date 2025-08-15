const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../../shared/middleware/auth.middleware');
const { executeQuery } = require('../../shared/database/database');
const { AppError, catchAsync, ApiResponse } = require('../../shared/utils');

// Todas las rutas requieren autenticación
router.use(authenticate);

// ==============================
// Tipos de camión
// ==============================
router.get('/truck-types', catchAsync(async (req, res) => {
	const sql = `
	  SELECT id, code, name, capacity_tons as max_payload_tn, useful_volume_m3,
	         max_length_m as deck_length_m, max_width_m as deck_width_m, max_height_m as max_stack_height_m,
	         cost_per_trip, is_active, created_at, updated_at
	  FROM dbo.truck_types
	  ORDER BY name`;
	const result = await executeQuery(sql);
	res.json(ApiResponse.success(result.recordset || [], 'Tipos de camión obtenidos'));
}));

router.post('/truck-types', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { code, name, capacity_tons = 0, useful_volume_m3 = 0, max_length_m = 0, max_width_m = 0, max_height_m = 0, cost_per_trip = 0, is_active = 1 } = req.body || {};
	if (!code || !name) throw new AppError('code y name son requeridos', 400);
	const sql = `
	  INSERT INTO dbo.truck_types(code, name, capacity_tons, useful_volume_m3, max_length_m, max_width_m, max_height_m, cost_per_trip, is_active, created_at, updated_at)
	  VALUES (@code, @name, @capacity_tons, @useful_volume_m3, @max_length_m, @max_width_m, @max_height_m, @cost_per_trip, @is_active, GETDATE(), GETDATE());
	  SELECT SCOPE_IDENTITY() AS id;`;
	const result = await executeQuery(sql, { code, name, capacity_tons, useful_volume_m3, max_length_m, max_width_m, max_height_m, cost_per_trip, is_active });
	res.status(201).json(ApiResponse.success({ id: result.recordset?.[0]?.id }, 'Tipo de camión creado', 201));
}));

router.put('/truck-types/:id', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { id } = req.params;
	const fields = ['code','name','capacity_tons','useful_volume_m3','max_length_m','max_width_m','max_height_m','cost_per_trip','is_active'];
	const updates = [];
	const params = { id: parseInt(id) };
	fields.forEach(k => {
		if (k in req.body) { updates.push(`${k} = @${k}`); params[k] = req.body[k]; }
	});
	if (updates.length === 0) throw new AppError('No hay campos para actualizar', 400);
	const sql = `UPDATE dbo.truck_types SET ${updates.join(', ')}, updated_at = GETDATE() WHERE id = @id`;
	await executeQuery(sql, params);
	res.json(ApiResponse.success({ id: params.id }, 'Tipo de camión actualizado'));
}));

router.delete('/truck-types/:id', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { id } = req.params;
	const used = await executeQuery('SELECT COUNT(1) AS cnt FROM dbo.family_packing_rules WHERE truck_type_id = @id', { id: parseInt(id) });
	if ((used.recordset?.[0]?.cnt || 0) > 0) throw new AppError('No se puede eliminar: tipo en uso en reglas de empaque', 400);
	await executeQuery('DELETE FROM dbo.truck_types WHERE id = @id', { id: parseInt(id) });
	res.json(ApiResponse.success(null, 'Tipo de camión eliminado'));
}));

// ==============================
// Reglas de empaque por familia
// ==============================
router.get('/packing-rules', catchAsync(async (req, res) => {
	const sql = `
	  SELECT pr.id, pr.family_id, pf.name as family_name, pr.truck_type_id, tt.name as truck_name,
	         pr.orientation, pr.min_gap_m, pr.max_stack_layers, pr.layer_height_m, pr.allow_mixed_lengths,
	         pr.notes, pr.created_at, pr.updated_at
	  FROM dbo.family_packing_rules pr
	  LEFT JOIN dbo.piece_families pf ON pr.family_id = pf.id
	  LEFT JOIN dbo.truck_types tt ON pr.truck_type_id = tt.id
	  ORDER BY pf.name, tt.name`;
	const result = await executeQuery(sql);
	res.json(ApiResponse.success(result.recordset || [], 'Reglas de empaque obtenidas'));
}));

router.post('/packing-rules', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { family_id, truck_type_id, orientation = 'ANY', min_gap_m = 0.1, max_stack_layers = 1, layer_height_m = null, allow_mixed_lengths = 0, notes = '' } = req.body || {};
	if (!family_id || !truck_type_id) throw new AppError('family_id y truck_type_id son requeridos', 400);
	const dup = await executeQuery('SELECT id FROM dbo.family_packing_rules WHERE family_id = @family_id AND truck_type_id = @truck_type_id', { family_id, truck_type_id });
	if (dup.recordset?.length) throw new AppError('Ya existe una regla para esta combinación', 400);
	const sql = `
	  INSERT INTO dbo.family_packing_rules(family_id, truck_type_id, orientation, min_gap_m, max_stack_layers, layer_height_m, allow_mixed_lengths, notes, created_at, updated_at)
	  VALUES (@family_id, @truck_type_id, @orientation, @min_gap_m, @max_stack_layers, @layer_height_m, @allow_mixed_lengths, @notes, GETDATE(), GETDATE());
	  SELECT SCOPE_IDENTITY() AS id;`;
	const result = await executeQuery(sql, { family_id, truck_type_id, orientation, min_gap_m, max_stack_layers, layer_height_m, allow_mixed_lengths, notes });
	res.status(201).json(ApiResponse.success({ id: result.recordset?.[0]?.id }, 'Regla creada', 201));
}));

router.put('/packing-rules/:id', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { id } = req.params;
	const fields = ['orientation','min_gap_m','max_stack_layers','layer_height_m','allow_mixed_lengths','notes'];
	const updates = [];
	const params = { id: parseInt(id) };
	fields.forEach(k => { if (k in req.body) { updates.push(`${k} = @${k}`); params[k] = req.body[k]; } });
	if (updates.length === 0) throw new AppError('No hay campos para actualizar', 400);
	const sql = `UPDATE dbo.family_packing_rules SET ${updates.join(', ')}, updated_at = GETDATE() WHERE id = @id`;
	await executeQuery(sql, params);
	res.json(ApiResponse.success({ id: params.id }, 'Regla actualizada'));
}));

router.delete('/packing-rules/:id', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { id } = req.params;
	await executeQuery('DELETE FROM dbo.family_packing_rules WHERE id = @id', { id: parseInt(id) });
	res.json(ApiResponse.success(null, 'Regla eliminada'));
}));

// ==============================
// Familias de piezas (solo lectura)
// ==============================
router.get('/piece-families', catchAsync(async (req, res) => {
	const sql = `SELECT id, code, name, description, is_active FROM dbo.piece_families WHERE is_active = 1 ORDER BY name`;
	const result = await executeQuery(sql);
	res.json(ApiResponse.success(result.recordset || [], 'Familias de piezas'));
}));

// ==============================
// Tarifas de transporte (persistencia simple en SystemConfig no disponible aquí) => usar tablas si existen
// Para compatibilidad, se guardan en tabla freight_rates agregando categoría como nota.
// ==============================
router.get('/transport-tariffs', catchAsync(async (req, res) => {
	const sql = `
	  SELECT id,
	         km_from as distance_from_km,
	         km_to as distance_to_km,
	         CAST(rate_under_12m AS DECIMAL(18,2)) as price_per_trip,
	         CAST(rate_over_12m AS DECIMAL(18,2)) as extra_per_km,
	         effective_date as valid_from,
	         expiry_date as valid_to,
	         NULL as zone_id,
	         '' as category,
	         '' as notes
	  FROM dbo.freight_rates
	  ORDER BY km_from`;
	const result = await executeQuery(sql);
	res.json(ApiResponse.success(result.recordset || [], 'Tarifas de transporte'));
}));

router.post('/transport-tariffs', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { distance_from_km = 0, distance_to_km = 0, price_per_trip = 0, extra_per_km = 0, valid_from = null, valid_to = null } = req.body || {};
	const sql = `
	  INSERT INTO dbo.freight_rates(km_from, km_to, rate_under_12m, rate_over_12m, effective_date, expiry_date, created_at, updated_at)
	  VALUES(@distance_from_km, @distance_to_km, @price_per_trip, @extra_per_km, @valid_from, @valid_to, GETDATE(), GETDATE());
	  SELECT SCOPE_IDENTITY() AS id;`;
	const result = await executeQuery(sql, { distance_from_km, distance_to_km, price_per_trip, extra_per_km, valid_from, valid_to });
	res.status(201).json(ApiResponse.success({ id: result.recordset?.[0]?.id }, 'Tarifa de transporte creada', 201));
}));

router.put('/transport-tariffs/:id', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { id } = req.params;
	const fieldsMap = {
		distance_from_km: 'km_from',
		distance_to_km: 'km_to',
		price_per_trip: 'rate_under_12m',
		extra_per_km: 'rate_over_12m',
		valid_from: 'effective_date',
		valid_to: 'expiry_date'
	};
	const updates = [];
	const params = { id: parseInt(id) };
	Object.entries(fieldsMap).forEach(([bodyKey, col]) => {
		if (bodyKey in req.body) { updates.push(`${col} = @${bodyKey}`); params[bodyKey] = req.body[bodyKey]; }
	});
	if (!updates.length) throw new AppError('No hay campos para actualizar', 400);
	const sql = `UPDATE dbo.freight_rates SET ${updates.join(', ')}, updated_at = GETDATE() WHERE id = @id`;
	await executeQuery(sql, params);
	res.json(ApiResponse.success({ id: params.id }, 'Tarifa de transporte actualizada'));
}));

router.delete('/transport-tariffs/:id', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { id } = req.params;
	await executeQuery('DELETE FROM dbo.freight_rates WHERE id = @id', { id: parseInt(id) });
	res.json(ApiResponse.success(null, 'Tarifa de transporte eliminada'));
}));

router.post('/transport-tariffs/copy', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { zone_id = null, from_date, to_date } = req.body || {};
	if (!from_date || !to_date) throw new AppError('from_date y to_date son requeridos', 400);
	const copySql = `
	  INSERT INTO dbo.freight_rates(km_from, km_to, rate_under_12m, rate_over_12m, effective_date, expiry_date, created_at, updated_at)
	  SELECT km_from, km_to, rate_under_12m, rate_over_12m, @to_date, NULL, GETDATE(), GETDATE()
	  FROM dbo.freight_rates WHERE effective_date = @from_date`;
	await executeQuery(copySql, { from_date, to_date });
	res.json(ApiResponse.success({ copied: true }, 'Tarifas copiadas'));
}));

// ==============================
// Tarifas de montaje (tabla mounting_rates)
// ==============================
router.get('/mounting-tariffs', catchAsync(async (req, res) => {
	const sql = `
	  SELECT id,
	         km_from, km_to,
	         CAST(rate_under_100t AS DECIMAL(18,2)) as price_per_ton,
	         CAST(rate_100t_300t AS DECIMAL(18,2)) as crane_day_rate,
	         CAST(rate_over_300t AS DECIMAL(18,2)) as price_per_km,
	         effective_date as valid_from,
	         expiry_date as valid_to
	  FROM dbo.mounting_rates
	  ORDER BY km_from`;
	const result = await executeQuery(sql);
	res.json(ApiResponse.success(result.recordset || [], 'Tarifas de montaje'));
}));

router.post('/mounting-tariffs', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { km_from = 0, km_to = 0, price_per_ton = 0, crane_day_rate = 0, price_per_km = 0, valid_from = null, valid_to = null } = req.body || {};
	const sql = `
	  INSERT INTO dbo.mounting_rates(km_from, km_to, rate_under_100t, rate_100t_300t, rate_over_300t, effective_date, expiry_date, created_at, updated_at)
	  VALUES(@km_from, @km_to, @price_per_ton, @crane_day_rate, @price_per_km, @valid_from, @valid_to, GETDATE(), GETDATE());
	  SELECT SCOPE_IDENTITY() AS id;`;
	const result = await executeQuery(sql, { km_from, km_to, price_per_ton, crane_day_rate, price_per_km, valid_from, valid_to });
	res.status(201).json(ApiResponse.success({ id: result.recordset?.[0]?.id }, 'Tarifa de montaje creada', 201));
}));

router.put('/mounting-tariffs/:id', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { id } = req.params;
	const fieldsMap = {
		km_from: 'km_from',
		km_to: 'km_to',
		price_per_ton: 'rate_under_100t',
		crane_day_rate: 'rate_100t_300t',
		price_per_km: 'rate_over_300t',
		valid_from: 'effective_date',
		valid_to: 'expiry_date'
	};
	const updates = [];
	const params = { id: parseInt(id) };
	Object.entries(fieldsMap).forEach(([bodyKey, col]) => {
		if (bodyKey in req.body) { updates.push(`${col} = @${bodyKey}`); params[bodyKey] = req.body[bodyKey]; }
	});
	if (!updates.length) throw new AppError('No hay campos para actualizar', 400);
	const sql = `UPDATE dbo.mounting_rates SET ${updates.join(', ')}, updated_at = GETDATE() WHERE id = @id`;
	await executeQuery(sql, params);
	res.json(ApiResponse.success({ id: params.id }, 'Tarifa de montaje actualizada'));
}));

router.delete('/mounting-tariffs/:id', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { id } = req.params;
	await executeQuery('DELETE FROM dbo.mounting_rates WHERE id = @id', { id: parseInt(id) });
	res.json(ApiResponse.success(null, 'Tarifa de montaje eliminada'));
}));

router.post('/mounting-tariffs/copy', authorize('admin', 'superadmin'), catchAsync(async (req, res) => {
	const { from_date, to_date } = req.body || {};
	if (!from_date || !to_date) throw new AppError('from_date y to_date son requeridos', 400);
	const copySql = `
	  INSERT INTO dbo.mounting_rates(km_from, km_to, rate_under_100t, rate_100t_300t, rate_over_300t, effective_date, expiry_date, created_at, updated_at)
	  SELECT km_from, km_to, rate_under_100t, rate_100t_300t, rate_over_300t, @to_date, NULL, GETDATE(), GETDATE()
	  FROM dbo.mounting_rates WHERE effective_date = @from_date`;
	await executeQuery(copySql, { from_date, to_date });
	res.json(ApiResponse.success({ copied: true }, 'Tarifas de montaje copiadas'));
}));

module.exports = { routes: router };