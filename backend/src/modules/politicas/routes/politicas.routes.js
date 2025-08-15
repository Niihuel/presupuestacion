const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('@compartido/middleware/auth.middleware');
const { executeQuery } = require('@compartido/database/database');
const { AppError, catchAsync, ApiResponse } = require('@utilidades');

// Obtener políticas actuales
router.get('/', authenticate, catchAsync(async (req, res) => {
  const query = `
    SELECT policy_key, policy_value, policy_type, description, updated_at, updated_by
    FROM system_policies
    WHERE is_active = 1
    ORDER BY policy_key
  `;
  const result = await executeQuery(query);
  const policies = {};
  result.forEach(row => {
    let value = row.policy_value;
    if (row.policy_type === 'boolean') value = value === 'true' || value === '1';
    else if (row.policy_type === 'number') value = parseFloat(value);
    policies[row.policy_key] = value;
  });
  res.json(ApiResponse.success(policies));
}));

// Actualizar políticas
router.put('/', authenticate, authorize('admin'), catchAsync(async (req, res) => {
  const policies = req.body;
  const userId = req.user.id;
  const timestamp = new Date().toISOString();
  await executeQuery('BEGIN TRANSACTION');
  try {
    for (const [key, value] of Object.entries(policies)) {
      let valueStr = String(value);
      let valueType = 'string';
      if (typeof value === 'boolean') { valueType = 'boolean'; valueStr = value ? 'true' : 'false'; }
      else if (typeof value === 'number') { valueType = 'number'; }
      const existing = await executeQuery('SELECT id FROM system_policies WHERE policy_key = @key', { key });
      if (existing.length > 0) {
        await executeQuery(`
          UPDATE system_policies
          SET policy_value = @value, policy_type = @type,
              updated_at = @timestamp, updated_by = @userId
          WHERE policy_key = @key
        `, { key, value: valueStr, type: valueType, timestamp, userId });
      } else {
        await executeQuery(`
          INSERT INTO system_policies (
            policy_key, policy_value, policy_type, description,
            is_active, created_at, created_by, updated_at, updated_by
          ) VALUES (
            @key, @value, @type, @description, 1, @timestamp, @userId, @timestamp, @userId
          )
        `, { key, value: valueStr, type: valueType, description: `Policy: ${key}`, timestamp, userId });
      }
    }
    await executeQuery('COMMIT');
    const result = await executeQuery('SELECT policy_key, policy_value, policy_type FROM system_policies WHERE is_active = 1');
    const updatedPolicies = {};
    result.forEach(row => {
      let value = row.policy_value;
      if (row.policy_type === 'boolean') value = value === 'true' || value === '1';
      else if (row.policy_type === 'number') value = parseFloat(value);
      updatedPolicies[row.policy_key] = value;
    });
    res.json(ApiResponse.success(updatedPolicies, 'Políticas actualizadas correctamente'));
  } catch (error) {
    await executeQuery('ROLLBACK');
    throw error;
  }
}));

module.exports = router;