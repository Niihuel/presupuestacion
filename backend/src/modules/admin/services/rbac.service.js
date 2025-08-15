const { Op } = require('sequelize');
const { sequelize, executeQuery } = require('../../../shared/database/database');
const { Role, RolePermission, UserRole } = require('../../../shared/database/models');

// Cache simple en memoria (puedes mover a cache.service si quieres unificar)
const effectiveCache = new Map();
const TTL_MS = 60 * 1000;

function setCache(userId, perms) {
  effectiveCache.set(userId, { perms, at: Date.now() });
}

function getCache(userId) {
  const entry = effectiveCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    effectiveCache.delete(userId);
    return null;
  }
  return entry.perms;
}

/**
 * Devuelve permisos efectivos del usuario { 'module:action': allowBoolean }
 */
async function getEffectivePermissions(userId) {
  const cached = getCache(userId);
  if (cached) return cached;

  // Traer roles del usuario
  const roles = await UserRole.findAll({ where: { user_id: userId } });
  const roleIds = roles.map(r => r.role_id);

  let allowSet = new Set();
  let denySet = new Set();

  if (roleIds.length > 0) {
    const rolePerms = await RolePermission.findAll({ where: { role_id: { [Op.in]: roleIds } }, raw: true });
    for (const rp of rolePerms) {
      // Resolver permisoId -> module:action (consulta directa)
      const result = await executeQuery('SELECT module, action FROM permissions WHERE id = @id', { id: rp.permission_id });
      const row = result?.recordset?.[0];
      if (!row) continue;
      const key = `${row.module}:${row.action}`;
      if (rp.allow) {
        allowSet.add(key);
      } else {
        denySet.add(key);
      }
    }
  }

  // Overrides de usuario
  const overrides = await executeQuery('SELECT p.module, p.action, up.allow FROM user_permissions up JOIN permissions p ON p.id = up.permission_id WHERE up.user_id = @uid', { uid: userId });
  for (const row of overrides.recordset || []) {
    const key = `${row.module}:${row.action}`;
    if (row.allow) allowSet.add(key);
    else denySet.add(key);
  }

  // Deny prevalece
  const effective = {};
  for (const k of allowSet) effective[k] = true;
  for (const k of denySet) effective[k] = false;

  setCache(userId, effective);
  return effective;
}

function invalidateUserPermissions(userId) {
  effectiveCache.delete(userId);
}

async function userHasPermission(user, moduleName, action) {
  // Superadmin bypass
  if (user?.role === 'superadmin') return true;
  const perms = await getEffectivePermissions(user.id);
  const key = `${moduleName}:${action}`;
  return perms[key] !== false && !!perms[key];
}

module.exports = {
  getEffectivePermissions,
  invalidateUserPermissions,
  userHasPermission
};



