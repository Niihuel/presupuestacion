/**
 * Hooks de Administración
 * 
 * React Query hooks para todas las operaciones administrativas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '../services/admin.service';

// ================================
// QUERY KEYS
// ================================

export const adminKeys = {
  all: ['admin'],
  users: () => [...adminKeys.all, 'users'],
  usersList: (filters) => [...adminKeys.users(), 'list', filters],
  user: (id) => [...adminKeys.users(), 'detail', id],
  usersStats: (period) => [...adminKeys.users(), 'stats', period],
  
  roles: () => [...adminKeys.all, 'roles'],
  permissions: () => [...adminKeys.all, 'permissions'],
  rolePermissions: (roleId) => [...adminKeys.all, 'roles', roleId, 'permissions'],
  
  auditLogs: (filters) => [...adminKeys.all, 'audit-logs', filters],
  auditStats: (period) => [...adminKeys.all, 'audit-stats', period],
  
  config: () => [...adminKeys.all, 'config'],
  
  dashboard: (period) => [...adminKeys.all, 'dashboard', period],
  systemStats: (period) => [...adminKeys.all, 'system-stats', period],
  reports: () => [...adminKeys.all, 'reports'],
  
  health: () => [...adminKeys.all, 'health'],
  metrics: (period) => [...adminKeys.all, 'metrics', period],
  
  notificationTemplates: () => [...adminKeys.all, 'notification-templates']
};

// ================================
// HOOKS DE USUARIOS
// ================================

/**
 * Hook para obtener lista de usuarios
 */
export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: adminKeys.usersList(filters),
    queryFn: () => adminService.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    keepPreviousData: true
  });
};

/**
 * Hook para obtener usuario específico
 */
export const useUser = (userId, options = {}) => {
  return useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: () => adminService.getUserById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    ...options
  });
};

/**
 * Hook para obtener estadísticas de usuarios
 */
export const useUsersStats = (period = '30d') => {
  return useQuery({
    queryKey: adminKeys.usersStats(period),
    queryFn: () => adminService.getUsersStats(period),
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
};

/**
 * Hook para crear usuario
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    }
  });
};

/**
 * Hook para actualizar usuario
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userData }) => adminService.updateUser(userId, userData),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    }
  });
};

/**
 * Hook para eliminar usuario
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    }
  });
};

/**
 * Hook para cambiar estado de usuario
 */
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, status }) => adminService.toggleUserStatus(userId, status),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    }
  });
};

/**
 * Hook para cambiar contraseña de usuario
 */
export const useChangeUserPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, passwordData }) => adminService.changeUserPassword(userId, passwordData),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
    }
  });
};

// ================================
// HOOKS DE ROLES Y PERMISOS
// ================================

/**
 * Hook para obtener roles
 */
export const useRoles = () => {
  return useQuery({
    queryKey: adminKeys.roles(),
    queryFn: adminService.getRoles,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
};

/**
 * Hook para obtener permisos
 */
export const usePermissions = () => {
  return useQuery({
    queryKey: adminKeys.permissions(),
    queryFn: adminService.getPermissions,
    staleTime: 15 * 60 * 1000 // 15 minutos
  });
};

export const useRolePermissions = (roleId) => {
  return useQuery({
    queryKey: adminKeys.rolePermissions(roleId),
    queryFn: () => adminService.getRolePermissions(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000
  });
};

/**
 * Hook para crear rol
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() });
    }
  });
};

/**
 * Hook para actualizar rol
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, roleData }) => adminService.updateRole(roleId, roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() });
    }
  });
};

/**
 * Hook para eliminar rol
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() });
    }
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissions }) => adminService.updateRolePermissions(roleId, permissions),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rolePermissions(roleId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() });
    }
  });
};

/**
 * Hook para asignar rol a usuario
 */
export const useAssignRoleToUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId }) => adminService.assignRoleToUser(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    }
  });
};

/**
 * Hook para remover rol de usuario
 */
export const useRemoveRoleFromUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId }) => adminService.removeRoleFromUser(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    }
  });
};

// ================================
// HOOKS DE AUDITORÍA
// ================================

/**
 * Hook para obtener logs de auditoría
 */
export const useAuditLogs = (filters = {}) => {
  return useQuery({
    queryKey: adminKeys.auditLogs(filters),
    queryFn: () => adminService.getAuditLogs(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    keepPreviousData: true
  });
};

/**
 * Hook para obtener estadísticas de auditoría
 */
export const useAuditStats = (period = '30d') => {
  return useQuery({
    queryKey: adminKeys.auditStats(period),
    queryFn: () => adminService.getAuditStats(period),
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
};

/**
 * Hook para exportar logs de auditoría
 */
export const useExportAuditLogs = () => {
  return useMutation({
    mutationFn: ({ filters, format }) => adminService.exportAuditLogs(filters, format),
    onSuccess: (blob, { format }) => {
      // Descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });
};

// ================================
// HOOKS DE CONFIGURACIÓN
// ================================

/**
 * Hook para obtener configuración del sistema
 */
export const useSystemConfig = () => {
  return useQuery({
    queryKey: adminKeys.config(),
    queryFn: adminService.getSystemConfig,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
};

/**
 * Hook para actualizar configuración del sistema
 */
export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.updateSystemConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.config() });
    }
  });
};

/**
 * Hook para resetear configuración del sistema
 */
export const useResetSystemConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.resetSystemConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.config() });
    }
  });
};

/**
 * Hook para backup de configuración
 */
export const useBackupSystemConfig = () => {
  return useMutation({
    mutationFn: adminService.backupSystemConfig,
    onSuccess: (blob) => {
      // Descargar el backup
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-config-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });
};

/**
 * Hook para restaurar configuración desde backup
 */
export const useRestoreSystemConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.restoreSystemConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.config() });
    }
  });
};

// ================================
// HOOKS DE REPORTES Y ESTADÍSTICAS
// ================================

/**
 * Hook para obtener dashboard de administración
 */
export const useAdminDashboard = (period = '30d') => {
  return useQuery({
    queryKey: adminKeys.dashboard(period),
    queryFn: () => adminService.getAdminDashboard(period),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000 // Actualizar cada 5 minutos
  });
};

/**
 * Hook para obtener estadísticas del sistema
 */
export const useSystemStats = (period = '30d') => {
  return useQuery({
    queryKey: adminKeys.systemStats(period),
    queryFn: () => adminService.getSystemStats(period),
    staleTime: 5 * 60 * 1000
  });
};

/**
 * Hook para generar reporte personalizado
 */
export const useGenerateCustomReport = () => {
  return useMutation({
    mutationFn: adminService.generateCustomReport
  });
};

/**
 * Hook para obtener reportes guardados
 */
export const useSavedReports = () => {
  return useQuery({
    queryKey: adminKeys.reports(),
    queryFn: adminService.getSavedReports,
    staleTime: 10 * 60 * 1000
  });
};

/**
 * Hook para eliminar reporte guardado
 */
export const useDeleteSavedReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.deleteSavedReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reports() });
    }
  });
};

// ================================
// HOOKS DE MONITOREO
// ================================

/**
 * Hook para obtener estado del sistema
 */
export const useSystemHealth = () => {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: adminService.getSystemHealth,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000 // Actualizar cada minuto
  });
};

/**
 * Hook para obtener métricas de rendimiento
 */
export const usePerformanceMetrics = (period = '1h') => {
  return useQuery({
    queryKey: adminKeys.metrics(period),
    queryFn: () => adminService.getPerformanceMetrics(period),
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: 2 * 60 * 1000 // Actualizar cada 2 minutos
  });
};

/**
 * Hook para limpiar caché del sistema
 */
export const useClearSystemCache = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.clearSystemCache,
    onSuccess: () => {
      // Invalidar todas las queries para forzar recarga
      queryClient.invalidateQueries();
    }
  });
};

/**
 * Hook para optimizar base de datos
 */
export const useOptimizeDatabase = () => {
  return useMutation({
    mutationFn: adminService.optimizeDatabase
  });
};

// ================================
// HOOKS DE NOTIFICACIONES
// ================================

/**
 * Hook para enviar notificación a usuarios
 */
export const useSendNotificationToUsers = () => {
  return useMutation({
    mutationFn: adminService.sendNotificationToUsers
  });
};

/**
 * Hook para obtener plantillas de notificaciones
 */
export const useNotificationTemplates = () => {
  return useQuery({
    queryKey: adminKeys.notificationTemplates(),
    queryFn: adminService.getNotificationTemplates,
    staleTime: 10 * 60 * 1000
  });
};

/**
 * Hook para crear plantilla de notificación
 */
export const useCreateNotificationTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminService.createNotificationTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.notificationTemplates() });
    }
  });
};

// ================================
// HOOKS COMPUESTOS
// ================================

/**
 * Hook para obtener datos completos del panel de administración
 */
export const useAdminPanelData = (period = '30d') => {
  const dashboard = useAdminDashboard(period);
  const systemHealth = useSystemHealth();
  const usersStats = useUsersStats(period);
  const auditStats = useAuditStats(period);
  
  return {
    dashboard,
    systemHealth,
    usersStats,
    auditStats,
    isLoading: dashboard.isLoading || systemHealth.isLoading || 
               usersStats.isLoading || auditStats.isLoading,
    error: dashboard.error || systemHealth.error || 
           usersStats.error || auditStats.error
  };
};

// ================================
// HOOK PRINCIPAL DE ADMINISTRACIÓN
// ================================

/**
 * Hook principal que exporta todos los hooks de administración
 * Este es el hook que se debe importar en los componentes
 */
export const useAdminHook = () => {
  return {
    // Hooks de usuarios
    useUsers,
    useUser,
    useUsersStats,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useToggleUserStatus,
    useChangeUserPassword,
    
    // Hooks de roles y permisos
    useRoles,
    usePermissions,
    useRolePermissions,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useUpdateRolePermissions,
    useAssignRoleToUser,
    useRemoveRoleFromUser,
    
    // Hooks de auditoría
    useAuditLogs,
    useAuditStats,
    useExportAuditLogs,
    
    // Hooks de configuración
    useSystemConfig,
    useUpdateSystemConfig,
    useResetSystemConfig,
    useBackupSystemConfig,
    useRestoreSystemConfig,
    
    // Hooks de reportes y estadísticas
    useAdminDashboard,
    useSystemStats,
    useGenerateCustomReport,
    useSavedReports,
    useDeleteSavedReport,
    
    // Nombres alternativos para compatibilidad
    useGetAdminDashboard: useAdminDashboard,
    useGetSystemStats: useSystemStats,
    useGetUsers: useUsers,
    useGetUsersStats: useUsersStats,
    useGetAuditLogs: useAuditLogs,
    useGetAuditStats: useAuditStats,
    useGetSystemConfig: useSystemConfig,
    useGetRoles: useRoles,
    useGetPermissions: usePermissions,
    
    // Hooks de monitoreo
    useSystemHealth,
    usePerformanceMetrics,
    useClearSystemCache,
    useOptimizeDatabase,
    
    // Hooks de notificaciones
    useSendNotificationToUsers,
    useNotificationTemplates,
    useCreateNotificationTemplate,
    
    // Hook compuesto
    useAdminPanelData,

    // Gate helper
    useCan
  };
};

// Hook de autorización para gatear UI
export const useCan = (permissionKey) => {
  // permissionKey form: 'module:action'
  const { permissions, isAuthenticated } = require('@nucleo/store/auth.store').useAuthStore.getState();
  if (!isAuthenticated) return false;
  if (!permissionKey) return true;
  const value = permissions?.[permissionKey];
  // false explícito bloquea, true permite, undefined = no concedido
  return value === true;
};

// Export por defecto para compatibilidad
export default useAdminHook;
