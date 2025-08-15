/**
 * Admin Module
 * Rutas: /api/v1/admin
 */

const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('@compartido/middleware/auth.middleware');
const { clearAllCaches } = require('@servicios/cache.service');
const { optimizeDatabase } = require('@servicios/query-optimizer.service');
const { executeQuery } = require('@compartido/database/database');
const { exportAudit } = require('./services/audit.service');
const { listUsers, assignRoleToUser, removeRoleFromUser } = require('./services/user.service');
const roleController = require('./roles/role.controller');

// Todas requieren autenticación; acciones críticas requieren admin/superadmin
router.use(authenticate);

// POST /api/v1/admin/cache/clear
router.post('/cache/clear', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const results = await clearAllCaches();
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/database/optimize
router.post('/database/optimize', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const result = await optimizeDatabase();
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/users
router.get('/users', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const result = await listUsers({ page: Number(page), limit: Number(limit), search, role, status });
    res.set('X-Total-Count', String(result.total));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Asignación de roles a usuario
router.post('/users/:userId/roles', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { roleId } = req.body;
    const { userId } = req.params;
    await assignRoleToUser(Number(userId), Number(roleId), req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:userId/roles/:roleId', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { userId, roleId } = req.params;
    await removeRoleFromUser(Number(userId), Number(roleId));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/audit/export
router.get('/audit/export', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;
    const { filename, contentType, buffer } = await exportAudit({ format });
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Roles & permissions catalog
router.get('/permissions', authorize('admin', 'superadmin'), roleController.getPermissionsCatalog);
router.get('/roles', authorize('admin', 'superadmin'), roleController.getRoles);
router.post('/roles', authorize('admin', 'superadmin'), roleController.createRole);
router.put('/roles/:id', authorize('admin', 'superadmin'), roleController.updateRole);
router.delete('/roles/:id', authorize('admin', 'superadmin'), roleController.deleteRole);
router.put('/roles/:id/permissions', authorize('admin', 'superadmin'), roleController.updateRolePermissions);
router.get('/roles/:id/permissions', authorize('admin', 'superadmin'), roleController.getRolePermissions);

// ==============================
// Parámetros de Proceso (process_parameters)
// ==============================

/**
 * GET /api/v1/admin/process-params?zone_id&month_date
 * Devuelve parámetros vigentes para zona/mes (o nulos si no existen)
 */
router.get('/process-params', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const zoneId = parseInt(req.query.zone_id);
    const monthDate = req.query.month_date || null;
    if (!zoneId || !monthDate) return res.status(400).json({ success: false, message: 'zone_id y month_date son requeridos' });
    const sql = `
      SELECT TOP 1 *
      FROM dbo.process_parameters
      WHERE (zone_id = @zone_id OR zone_id IS NULL)
        AND EOMONTH(month_date) = EOMONTH(@month_date)
      ORDER BY CASE WHEN zone_id = @zone_id THEN 0 ELSE 1 END`;
    const result = await executeQuery(sql, { zone_id: zoneId, month_date: monthDate });
    res.json({ success: true, data: result?.recordset?.[0] || null });
  } catch (error) { next(error); }
});

/**
 * UPSERT /api/v1/admin/process-params
 * body: { zone_id, month_date, ...campos }
 */
router.post('/process-params', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const {
      zone_id,
      month_date,
      energia_curado_tn = 0,
      gg_fabrica_tn = 0,
      gg_empresa_tn = 0,
      utilidad_tn = 0,
      ingenieria_tn = 0,
      precio_hora = 0,
      horas_por_tn_acero = 70,
      horas_por_m3_hormigon = 25
    } = req.body || {};
    if (!zone_id || !month_date) return res.status(400).json({ success: false, message: 'zone_id y month_date son requeridos' });
    const sql = `
      IF EXISTS (SELECT 1 FROM dbo.process_parameters WHERE zone_id = @zone_id AND month_date = @month_date)
      BEGIN
        UPDATE dbo.process_parameters
        SET energia_curado_tn = @energia_curado_tn,
            gg_fabrica_tn = @gg_fabrica_tn,
            gg_empresa_tn = @gg_empresa_tn,
            utilidad_tn = @utilidad_tn,
            ingenieria_tn = @ingenieria_tn,
            precio_hora = @precio_hora,
            horas_por_tn_acero = @horas_por_tn_acero,
            horas_por_m3_hormigon = @horas_por_m3_hormigon,
            updated_at = SYSUTCDATETIME()
        WHERE zone_id = @zone_id AND month_date = @month_date;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.process_parameters(
          zone_id, month_date, energia_curado_tn, gg_fabrica_tn, gg_empresa_tn,
          utilidad_tn, ingenieria_tn, precio_hora, horas_por_tn_acero, horas_por_m3_hormigon,
          created_at, updated_at
        ) VALUES (
          @zone_id, @month_date, @energia_curado_tn, @gg_fabrica_tn, @gg_empresa_tn,
          @utilidad_tn, @ingenieria_tn, @precio_hora, @horas_por_tn_acero, @horas_por_m3_hormigon,
          SYSUTCDATETIME(), SYSUTCDATETIME()
        );
      END;
      SELECT * FROM dbo.process_parameters WHERE zone_id = @zone_id AND month_date = @month_date;`;
    const result = await executeQuery(sql, {
      zone_id, month_date,
      energia_curado_tn, gg_fabrica_tn, gg_empresa_tn, utilidad_tn, ingenieria_tn,
      precio_hora, horas_por_tn_acero, horas_por_m3_hormigon
    });
    res.json({ success: true, data: result?.recordset?.[0] || null });
  } catch (error) { next(error); }
});

module.exports = router;


