const { Op } = require('sequelize');
const User = require('../../../shared/database/models/User.model');
const { UserRole } = require('../../../shared/database/models');
const { invalidateUserPermissions } = require('./rbac.service');

async function listUsers({ page = 1, limit = 20, search = '', role = '', status = '' }) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { username: { [Op.like]: `%${search}%` } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.is_active = status === 'active' ? true : status === 'inactive' ? false : undefined;
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await User.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
    attributes: ['id','email','username','first_name','last_name','phone','avatar_url','is_active','is_verified','role','last_login','created_at']
  });

  const users = rows.map(u => ({
    id: u.id,
    email: u.email,
    username: u.username,
    name: `${u.first_name} ${u.last_name}`.trim(),
    phone: u.phone,
    avatar: u.avatar_url,
    status: u.is_active ? 'active' : 'inactive',
    is_verified: u.is_verified,
    role: u.role,
    last_login: u.last_login,
    created_at: u.created_at,
  }));

  return { users, total: count, page, limit };
}

async function assignRoleToUser(userId, roleId, assignedBy = null) {
  await UserRole.findOrCreate({ where: { user_id: userId, role_id: roleId }, defaults: { assigned_by: assignedBy } });
  invalidateUserPermissions(userId);
  return { success: true };
}

async function removeRoleFromUser(userId, roleId) {
  await UserRole.destroy({ where: { user_id: userId, role_id: roleId } });
  invalidateUserPermissions(userId);
  return { success: true };
}

module.exports = { listUsers, assignRoleToUser, removeRoleFromUser };


