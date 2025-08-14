/**
 * Servicio de Administración
 * 
 * Funciones para la gestión administrativa del sistema
 */

import api from './api';

// ================================
// GESTIÓN DE USUARIOS
// ================================

export const getUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/admin/users?${params}`);
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const getUsersStats = async (period = 'month') => {
  const response = await api.get(`/admin/users/stats?period=${period}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const toggleUserStatus = async (userId, status) => {
  const response = await api.patch(`/admin/users/${userId}/status`, { status });
  return response.data;
};

export const changeUserPassword = async (userId, passwordData) => {
  const response = await api.patch(`/admin/users/${userId}/password`, passwordData);
  return response.data;
};

// ================================
// GESTIÓN DE ROLES Y PERMISOS
// ================================

export const getRoles = async () => {
  const response = await api.get('/admin/roles');
  return response.data;
};

export const getPermissions = async () => {
  const response = await api.get('/admin/permissions');
  return response.data;
};

export const getRolePermissions = async (roleId) => {
  const { data } = await api.get(`/admin/roles/${roleId}/permissions`);
  return data;
};

export const createRole = async (roleData) => {
  const response = await api.post('/admin/roles', roleData);
  return response.data;
};

export const updateRole = async (roleId, roleData) => {
  const response = await api.put(`/admin/roles/${roleId}`, roleData);
  return response.data;
};

export const deleteRole = async (roleId) => {
  const response = await api.delete(`/admin/roles/${roleId}`);
  return response.data;
};

export const assignRoleToUser = async (userId, roleId) => {
  const response = await api.post(`/admin/users/${userId}/roles`, { roleId });
  return response.data;
};

export const removeRoleFromUser = async (userId, roleId) => {
  const response = await api.delete(`/admin/users/${userId}/roles/${roleId}`);
  return response.data;
};

export const updateRolePermissions = async (roleId, permissions) => {
  const { data } = await api.put(`/admin/roles/${roleId}/permissions`, { permissions });
  return data;
};

// ================================
// AUDITORÍA
// ================================

export const getAuditLogs = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/admin/audit?${params}`);
  return response.data;
};

export const getAuditStats = async (period = 'month') => {
  const response = await api.get(`/admin/audit/stats?period=${period}`);
  return response.data;
};

export const exportAuditLogs = async (filters = {}, format = 'csv') => {
  const params = new URLSearchParams({ ...filters, format });
  const response = await api.get(`/admin/audit/export?${params}`, {
    responseType: 'blob'
  });
  return response.data;
};

// ================================
// CONFIGURACIÓN DEL SISTEMA
// ================================

export const getSystemConfig = async () => {
  const response = await api.get('/admin/config');
  return response.data;
};

export const updateSystemConfig = async (configData) => {
  const response = await api.put('/admin/config', configData);
  return response.data;
};

export const resetSystemConfig = async () => {
  const response = await api.post('/admin/config/reset');
  return response.data;
};

// ================================
// BACKUP / RESTORE CONFIG
// ================================

export const backupSystemConfig = async () => {
  const response = await api.get('/admin/config/backup', { responseType: 'blob' });
  return response.data;
};

export const restoreSystemConfig = async (payload) => {
  if (payload instanceof File) {
    const form = new FormData();
    form.append('file', payload);
    const response = await api.post('/admin/config/restore', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
  const response = await api.post('/admin/config/restore', payload);
  return response.data;
};

// ================================
// DASHBOARD / STATS / REPORTS
// ================================

export const getAdminDashboard = async (period = '30d') => {
  const range = period === '30d' ? 'month' : period;
  // Cargar stats reales del backend
  const { data } = await api.get(`/dashboard/stats?range=${encodeURIComponent(range)}`);
  const metrics = data?.metrics || {};

  // Métricas principales mapeadas
  const users = { total: metrics.totalUsers || 0, change: 0, trend: 'stable', active: metrics.totalUsers || 0 };
  const sessions = { active: 0, change: 0, trend: 'stable', peak: 0 };
  const audit = { total_events: (data?.recentActivity || []).length, change: 0, trend: 'stable', critical: 0 };
  const database = { usage_percentage: 0, change: 0, trend: 'stable', size_gb: 0 };

  // Actividad de usuarios derivada desde recentActivity (conteo por día)
  const recent = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const byDay = recent.reduce((acc, evt) => {
    const d = new Date(evt.timestamp);
    const key = isNaN(d.getTime()) ? 'unknown' : d.toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const last7 = [...Object.keys(byDay)].sort().slice(-7);
  const totalUsers = users.total || 0;
  const user_activity = last7.map(day => ({
    date: day,
    active_users: byDay[day],
    total_users: totalUsers
  }));

  // Distribución de roles: intentar obtener usuarios; si no existe endpoint, fallback vacío
  let roles_distribution = [];
  try {
    const params = new URLSearchParams({ limit: 1000, page: 1 });
    const usersResp = await api.get(`/admin/users?${params.toString()}`);
    const list = usersResp?.data?.users || usersResp?.data || [];
    const counts = list.reduce((acc, u) => {
      const role = u.role || 'user';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 0;
    const palette = {
      admin: '#8b5cf6',
      manager: '#3b82f6',
      user: '#10b981',
      viewer: '#6b7280'
    };
    roles_distribution = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
      color: palette[name] || '#6b7280'
    }));
  } catch (e) {
    // Si el endpoint no existe, dejar vacío para que el UI muestre estado "sin datos"
    roles_distribution = [];
  }

  const critical_events = [];
  return { users, sessions, audit, database, user_activity, roles_distribution, critical_events };
};

export const getSystemStats = async (_period = '30d') => {
  // Usar /health como fuente básica
  const { data } = await api.get(`/health`, { baseURL: import.meta.env.VITE_API_URL?.replace('/api/v1','') || undefined });
  const uptimeSeconds = Math.floor(data?.uptime || 0);
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  return {
    uptime: `${days}d ${hours}h ${minutes}m`,
    cpu_usage: data?.metrics?.cpu_usage ?? 0,
    memory_usage: data?.metrics?.memory_usage ?? 0,
    disk_usage: data?.metrics?.disk_usage ?? 0,
  };
};

export const generateCustomReport = async (params = {}) => {
  const response = await api.post('/admin/reports/custom', params, { responseType: 'blob' });
  return response.data;
};

export const getSavedReports = async () => {
  const response = await api.get('/admin/reports/saved');
  return response.data;
};

export const deleteSavedReport = async (reportId) => {
  const response = await api.delete(`/admin/reports/saved/${reportId}`);
  return response.data;
};

// ================================
// SYSTEM HEALTH / PERFORMANCE / MAINTENANCE
// ================================

export const getSystemHealth = async () => {
  const response = await api.get('/admin/system/health');
  return response.data;
};

export const getPerformanceMetrics = async (period = '1h') => {
  const response = await api.get(`/admin/system/metrics?period=${encodeURIComponent(period)}`);
  return response.data;
};

export const clearSystemCache = async () => {
  const response = await api.post('/admin/cache/clear');
  return response.data;
};

export const optimizeDatabase = async () => {
  const response = await api.post('/admin/database/optimize');
  return response.data;
};

// ================================
// NOTIFICATIONS
// ================================

export const sendNotificationToUsers = async (payload) => {
  const response = await api.post('/admin/notifications/send', payload);
  return response.data;
};

export const getNotificationTemplates = async () => {
  const response = await api.get('/admin/notifications/templates');
  return response.data;
};

export const createNotificationTemplate = async (template) => {
  const response = await api.post('/admin/notifications/templates', template);
  return response.data;
};
