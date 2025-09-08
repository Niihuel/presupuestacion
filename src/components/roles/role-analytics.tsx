"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  Shield, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Activity,
  Target,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: any[];
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface RoleAnalyticsProps {
  roles: Role[];
  permissions: Record<string, Permission[]>;
  users?: any[];
}

export function RoleAnalytics({ roles, permissions, users = [] }: RoleAnalyticsProps) {
  // Helper function to translate permission names to Spanish
  function translatePermissionName(permission: string): string {
    const translations: Record<string, string> = {
      // Budgets
      'budgets.view': 'Presupuestos - Ver',
      'budgets.create': 'Presupuestos - Crear',
      'budgets.edit': 'Presupuestos - Editar',
      'budgets.delete': 'Presupuestos - Eliminar',
      'budgets.approve': 'Presupuestos - Aprobar',
      
      // Users
      'users.view': 'Usuarios - Ver',
      'users.create': 'Usuarios - Crear',
      'users.edit': 'Usuarios - Editar',
      'users.delete': 'Usuarios - Eliminar',
      'users.approve': 'Usuarios - Aprobar',
      
      // Projects
      'projects.view': 'Proyectos - Ver',
      'projects.create': 'Proyectos - Crear',
      'projects.edit': 'Proyectos - Editar',
      'projects.delete': 'Proyectos - Eliminar',
      
      // Materials
      'materials.view': 'Materiales - Ver',
      'materials.create': 'Materiales - Crear',
      'materials.edit': 'Materiales - Editar',
      'materials.delete': 'Materiales - Eliminar',
      
      // Pieces
      'pieces.view': 'Piezas - Ver',
      'pieces.create': 'Piezas - Crear',
      'pieces.edit': 'Piezas - Editar',
      'pieces.delete': 'Piezas - Eliminar',
      
      // Roles
      'roles.view': 'Roles - Ver',
      'roles.create': 'Roles - Crear',
      'roles.edit': 'Roles - Editar',
      'roles.delete': 'Roles - Eliminar',
      
      // Dashboard
      'dashboard.view': 'Panel de Control - Ver',
      
      // System
      'system.view': 'Sistema - Ver',
      'system.manage': 'Sistema - Gestionar',
      
      // Parameters
      'parameters.view': 'Parámetros - Ver',
      'parameters.edit': 'Parámetros - Editar',
      
      // Customers
      'customers.view': 'Clientes - Ver',
      'customers.create': 'Clientes - Crear',
      'customers.edit': 'Clientes - Editar',
      'customers.delete': 'Clientes - Eliminar',
    };
    
    return translations[permission] || permission;
  }
  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalPermissions = Object.values(permissions).flat().length;
    const totalRoles = roles.length;
    const totalUsers = users.length;

    // Permission coverage analysis
    const permissionCoverage = Object.entries(permissions).map(([resource, perms]) => {
      const coveredPermissions = perms.filter(perm => 
        roles.some(role => 
          role.permissions.some(rp => rp.id === perm.id)
        )
      );
      
      return {
        resource,
        total: perms.length,
        covered: coveredPermissions.length,
        coverage: (coveredPermissions.length / perms.length) * 100
      };
    });

    // Role distribution by permission count
    const roleDistribution = roles.map(role => ({
      name: role.name,
      permissions: role.permissions.length,
      coverage: (role.permissions.length / totalPermissions) * 100
    }));

    // Most and least used permissions
    const permissionUsage = Object.values(permissions).flat().map(perm => {
      const usage = roles.filter(role => 
        role.permissions.some(rp => rp.id === perm.id)
      ).length;
      
      return {
        permission: translatePermissionName(`${perm.resource}.${perm.action}`),
        originalPermission: `${perm.resource}.${perm.action}`,
        usage,
        percentage: (usage / totalRoles) * 100
      };
    }).sort((a, b) => b.usage - a.usage);

    // Resource coverage radar data
    const resourceRadarData = Object.entries(permissions).map(([resource, perms]) => {
      const actions = ['view', 'create', 'edit', 'delete', 'approve'];
      const actionCoverage: Record<string, number> = {};
      
      actions.forEach(action => {
        const actionPerms = perms.filter(p => p.action === action);
        const coveredCount = actionPerms.filter(perm => 
          roles.some(role => 
            role.permissions.some(rp => rp.id === perm.id)
          )
        ).length;
        
        actionCoverage[action] = actionPerms.length > 0 ? (coveredCount / actionPerms.length) * 100 : 0;
      });
      
      return {
        resource,
        view: actionCoverage.view || 0,
        create: actionCoverage.create || 0,
        edit: actionCoverage.edit || 0,
        delete: actionCoverage.delete || 0,
        approve: actionCoverage.approve || 0
      };
    });

    // Security insights
    const insights = {
      overPrivilegedRoles: roles.filter(role => role.permissions.length > totalPermissions * 0.7),
      underPrivilegedRoles: roles.filter(role => role.permissions.length < totalPermissions * 0.1),
      uncoveredPermissions: Object.values(permissions).flat().filter(perm => 
        !roles.some(role => role.permissions.some(rp => rp.id === perm.id))
      ),
      duplicateRoles: roles.filter((role, index, arr) => 
        arr.findIndex(r => 
          r.permissions.length === role.permissions.length &&
          r.permissions.every(p => role.permissions.some(rp => rp.id === p.id))
        ) !== index
      )
    };

    return {
      totalPermissions,
      totalRoles,
      totalUsers,
      permissionCoverage,
      roleDistribution,
      permissionUsage,
      resourceRadarData,
      insights,
      avgPermissionsPerRole: totalRoles > 0 ? roles.reduce((sum, role) => sum + role.permissions.length, 0) / totalRoles : 0,
      overallCoverage: (Object.values(permissions).flat().filter(perm => 
        roles.some(role => role.permissions.some(rp => rp.id === perm.id))
      ).length / totalPermissions) * 100
    };
  }, [roles, permissions, users]);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Total de Roles</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{analytics.totalRoles}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Cobertura General</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {analytics.overallCoverage.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Promedio Permisos/Rol</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {analytics.avgPermissionsPerRole.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Usuarios Asignados</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{analytics.totalUsers}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Role Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <h3 className="text-lg font-semibold">Distribución de Permisos por Rol</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.roleDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-primary)', 
                      border: '1px solid var(--surface-border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="permissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resource Coverage Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <h3 className="text-lg font-semibold">Cobertura por Recurso</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analytics.resourceRadarData.slice(0, 6)}>
                  <PolarGrid stroke="var(--surface-border)" />
                  <PolarAngleAxis dataKey="resource" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Cobertura"
                    dataKey="view"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="Crear"
                    dataKey="create"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="Editar"
                    dataKey="edit"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.1}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Security Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Análisis de Seguridad
            </h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Over-privileged roles */}
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Roles Sobreprivilegiados
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {analytics.insights.overPrivilegedRoles.length}
                </div>
                <div className="text-xs text-red-600">
                  &gt;70% de permisos totales
                </div>
              </div>

              {/* Under-privileged roles */}
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Roles Subprivilegiados
                  </span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {analytics.insights.underPrivilegedRoles.length}
                </div>
                <div className="text-xs text-yellow-600">
                  &lt;10% de permisos totales
                </div>
              </div>

              {/* Uncovered permissions */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Permisos Sin Asignar
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {analytics.insights.uncoveredPermissions.length}
                </div>
                <div className="text-xs text-blue-600">
                  Sin cobertura en roles
                </div>
              </div>

              {/* Duplicate roles */}
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Roles Duplicados
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {analytics.insights.duplicateRoles.length}
                </div>
                <div className="text-xs text-purple-600">
                  Permisos idénticos
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {(analytics.insights.overPrivilegedRoles.length > 0 || 
              analytics.insights.uncoveredPermissions.length > 0 ||
              analytics.insights.duplicateRoles.length > 0) && (
              <div className="space-y-3">
                <h4 className="font-medium text-[var(--text-primary)]">Recomendaciones</h4>
                <div className="space-y-2">
                  {analytics.insights.overPrivilegedRoles.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Revisar roles sobreprivilegiados:</span>
                        <span className="text-[var(--text-secondary)]"> {analytics.insights.overPrivilegedRoles.map(r => r.name).join(', ')}</span>
                      </div>
                    </div>
                  )}
                  
                  {analytics.insights.uncoveredPermissions.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Asignar permisos sin cobertura</span>
                        <span className="text-[var(--text-secondary)]"> a roles existentes o crear nuevos roles especializados.</span>
                      </div>
                    </div>
                  )}

                  {analytics.insights.duplicateRoles.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Consolidar roles duplicados:</span>
                        <span className="text-[var(--text-secondary)]"> {analytics.insights.duplicateRoles.map(r => r.name).join(', ')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Permission Usage Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <h3 className="text-lg font-semibold">Uso de Permisos</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Most used permissions */}
                <div>
                  <h4 className="font-medium mb-3 text-green-600">Más Utilizados</h4>
                  <div className="space-y-2">
                    {analytics.permissionUsage.slice(0, 5).map((perm, index) => (
                      <div key={perm.permission} className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-900/20">
                        <span className="text-sm font-medium">#{index + 1} {perm.permission}</span>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          {perm.usage} roles ({perm.percentage.toFixed(0)}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Least used permissions */}
                <div>
                  <h4 className="font-medium mb-3 text-red-600">Menos Utilizados</h4>
                  <div className="space-y-2">
                    {analytics.permissionUsage.slice(-5).reverse().map((perm, index) => (
                      <div key={perm.permission} className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-900/20">
                        <span className="text-sm font-medium">#{index + 1} {perm.permission}</span>
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          {perm.usage} roles ({perm.percentage.toFixed(0)}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}