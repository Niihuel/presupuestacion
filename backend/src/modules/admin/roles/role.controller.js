const { Op } = require('sequelize');
const { Role, RolePermission } = require('@modelos');
const { executeQuery } = require('@compartido/database/database');
const { invalidateUserPermissions } = require('../services/rbac.service');

const getPermissionsCatalog = async (req, res, next) => {
  try {
    const result = await executeQuery('SELECT id, module, action, description FROM permissions ORDER BY module, action');
    res.json(result.recordset || []);
  } catch (error) {
    next(error);
  }
};

const getRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await RolePermission.findAll({ where: { role_id: id }, raw: true });
    res.json(rows.map(r => ({ permissionId: r.permission_id, allow: !!r.allow, scope: r.scope || null })));
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({ order: [['priority', 'DESC'], ['name', 'ASC']] });
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { name, key, description, color, priority = 50, assignable = true } = req.body;
    const role = await Role.create({ name, key, description, color, priority, assignable, is_system: false, is_default: false });
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    const { name, key, description, color, priority, assignable } = req.body;
    await role.update({ name, key, description, color, priority, assignable });
    res.json(role);
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    await role.destroy();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions = [] } = req.body; // [{permissionId, allow, scope}]
    // Replace all
    await RolePermission.destroy({ where: { role_id: id } });
    if (Array.isArray(permissions) && permissions.length) {
      await RolePermission.bulkCreate(
        permissions.map(p => ({ role_id: Number(id), permission_id: Number(p.permissionId), allow: !!p.allow, scope: p.scope || null }))
      );
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPermissionsCatalog,
  getRolePermissions,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions
};


