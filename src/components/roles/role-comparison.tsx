"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Users, 
  Check, 
  X, 
  Plus,
  Minus,
  ArrowLeftRight,
  Copy,
  Eye,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface RoleComparisonProps {
  roles: Role[];
  permissions: Record<string, Permission[]>;
  onCreateRole?: (name: string, description: string, permissions: string[]) => void;
}

export function RoleComparison({ roles, permissions, onCreateRole }: RoleComparisonProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<"permissions" | "gaps" | "overlap">("permissions");

  // Get friendly resource names
  const getResourceDisplayName = (resource: string): string => {
    const resourceNames: Record<string, string> = {
      dashboard: "Panel de Control",
      budgets: "Presupuestos",
      projects: "Obras",
      customers: "Clientes",
      materials: "Materiales",
      pieces: "Piezas",
      users: "Usuarios",
      system: "Sistema",
      plants: "Plantas",
      molds: "Moldes",
      designers: "Diseñadores",
      trucks: "Camiones",
      calendar: "Calendario",
      parameters: "Parámetros",
      permissions: "Permisos",
      roles: "Roles"
    };
    return resourceNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
  };

  // Get friendly action names
  const getActionDisplayName = (action: string): string => {
    const actionNames: Record<string, string> = {
      view: "Ver",
      create: "Crear",
      edit: "Editar",
      delete: "Eliminar",
      approve: "Aprobar",
      export: "Exportar",
      backup: "Respaldar",
      restore: "Restaurar"
    };
    return actionNames[action] || action.charAt(0).toUpperCase() + action.slice(1);
  };

  // Get selected roles data
  const selectedRolesData = useMemo(() => {
    return selectedRoles.map(roleId => roles.find(r => r.id === roleId)).filter(Boolean) as Role[];
  }, [selectedRoles, roles]);

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (selectedRolesData.length === 0) return { permissionMatrix: [], statistics: null };

    const allPermissions = Object.values(permissions).flat();
    
    // Create permission matrix
    const permissionMatrix = allPermissions.map(permission => {
      const rolePermissions = selectedRolesData.map(role => ({
        roleId: role.id,
        roleName: role.name,
        hasPermission: role.permissions.some(p => p.id === permission.id)
      }));

      const hasAnyDifference = rolePermissions.some(rp => rp.hasPermission) && 
                              rolePermissions.some(rp => !rp.hasPermission);

      return {
        permission,
        rolePermissions,
        hasAnyDifference,
        allHave: rolePermissions.every(rp => rp.hasPermission),
        noneHave: rolePermissions.every(rp => !rp.hasPermission)
      };
    });

    // Filter by search query
    const filteredMatrix = permissionMatrix.filter(item => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          getResourceDisplayName(item.permission.resource).toLowerCase().includes(query) ||
          getActionDisplayName(item.permission.action).toLowerCase().includes(query) ||
          item.permission.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Filter by differences only
    const finalMatrix = showDifferencesOnly 
      ? filteredMatrix.filter(item => item.hasAnyDifference)
      : filteredMatrix;

    // Calculate statistics
    const statistics = {
      totalPermissions: allPermissions.length,
      commonPermissions: permissionMatrix.filter(p => p.allHave).length,
      uniquePermissions: permissionMatrix.filter(p => p.hasAnyDifference).length,
      noAccessPermissions: permissionMatrix.filter(p => p.noneHave).length,
      roleStats: selectedRolesData.map(role => {
        const rolePermissionIds = role.permissions.map(p => p.id);
        const unique = allPermissions.filter(p => 
          rolePermissionIds.includes(p.id) &&
          !selectedRolesData.some(otherRole => 
            otherRole.id !== role.id && 
            otherRole.permissions.some(op => op.id === p.id)
          )
        );
        
        return {
          roleId: role.id,
          roleName: role.name,
          totalPermissions: role.permissions.length,
          uniquePermissions: unique.length,
          coverage: (role.permissions.length / allPermissions.length) * 100
        };
      })
    };

    return { permissionMatrix: finalMatrix, statistics };
  }, [selectedRolesData, permissions, searchQuery, showDifferencesOnly]);

  // Handle role selection
  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else if (prev.length < 4) { // Limit to 4 roles for comparison
        return [...prev, roleId];
      } else {
        toast.warning("Máximo 4 roles para comparación");
        return prev;
      }
    });
  };

  // Create merged role from selected roles
  const createMergedRole = () => {
    if (selectedRolesData.length < 2) {
      toast.error("Selecciona al menos 2 roles para crear uno combinado");
      return;
    }

    const allPermissionIds = new Set<string>();
    selectedRolesData.forEach(role => {
      role.permissions.forEach(p => allPermissionIds.add(p.id));
    });

    const mergedName = `Combinado (${selectedRolesData.map(r => r.name).join(" + ")})`;
    const mergedDescription = `Rol combinado con permisos de: ${selectedRolesData.map(r => r.name).join(", ")}`;

    if (onCreateRole) {
      onCreateRole(mergedName, mergedDescription, Array.from(allPermissionIds));
      toast.success("Rol combinado creado exitosamente");
    }
  };

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Array<{
      permission: Permission;
      rolePermissions: { roleId: string; roleName: string; hasPermission: boolean; }[];
      hasAnyDifference: boolean;
      allHave: boolean;
      noneHave: boolean;
    }>> = {};
    
    comparisonData.permissionMatrix.forEach(item => {
      const resource = item.permission.resource;
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(item);
    });

    return groups;
  }, [comparisonData.permissionMatrix]);

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Comparación de Roles
              </h2>
              <p className="text-[var(--text-secondary)] mt-1">
                Selecciona hasta 4 roles para comparar sus permisos
              </p>
            </div>
            <Badge variant="outline">
              {selectedRoles.length}/4 roles seleccionados
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {roles.map(role => {
              const isSelected = selectedRoles.includes(role.id);
              return (
                <motion.button
                  key={role.id}
                  onClick={() => toggleRoleSelection(role.id)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-200 text-left",
                    isSelected
                      ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] shadow-md"
                      : "bg-[var(--surface-primary)] border-[var(--surface-border)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent-primary)]/30"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[var(--text-primary)]">{role.name}</h3>
                    {isSelected && <Check className="h-4 w-4 text-[var(--accent-primary)]" />}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    {role.description || "Sin descripción"}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {role.permissions.length} permisos
                  </Badge>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedRolesData.length > 0 && (
        <div className="space-y-6">
          {/* Statistics Overview */}
          {comparisonData.statistics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Resumen de Comparación</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="text-2xl font-bold text-green-600">
                        {comparisonData.statistics.commonPermissions}
                      </div>
                      <div className="text-sm text-green-600">Permisos Comunes</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="text-2xl font-bold text-blue-600">
                        {comparisonData.statistics.uniquePermissions}
                      </div>
                      <div className="text-sm text-blue-600">Permisos Únicos</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div className="text-2xl font-bold text-red-600">
                        {comparisonData.statistics.noAccessPermissions}
                      </div>
                      <div className="text-sm text-red-600">Sin Acceso</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="text-2xl font-bold text-purple-600">
                        {comparisonData.statistics.totalPermissions}
                      </div>
                      <div className="text-sm text-purple-600">Total Permisos</div>
                    </div>
                  </div>

                  {/* Role Statistics */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Estadísticas por Rol</h4>
                    <div className="grid gap-3">
                      {comparisonData.statistics.roleStats.map(stat => (
                        <div key={stat.roleId} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-primary)]">
                          <div>
                            <span className="font-medium">{stat.roleName}</span>
                            <div className="text-sm text-[var(--text-secondary)]">
                              {stat.totalPermissions} permisos total • {stat.uniquePermissions} únicos
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{stat.coverage.toFixed(1)}%</div>
                            <div className="text-xs text-[var(--text-secondary)]">cobertura</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Filters and Controls */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                    <Input
                      placeholder="Buscar permisos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>

                  {/* Show differences only */}
                  <Button
                    variant={showDifferencesOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Solo diferencias
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createMergedRole}
                    disabled={selectedRolesData.length < 2 || !onCreateRole}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Crear rol combinado
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRoles([])}
                  >
                    Limpiar selección
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permission Comparison Matrix */}
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([resource, items]) => (
              <motion.div
                key={resource}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  {getResourceDisplayName(resource)}
                </h3>

                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={item.permission.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      {/* Permission info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--text-primary)]">
                          {getActionDisplayName(item.permission.action)}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {item.permission.description || `${item.permission.resource}.${item.permission.action}`}
                        </div>
                      </div>

                      {/* Role permissions matrix */}
                      <div className="flex gap-3">
                        {item.rolePermissions.map(rp => (
                          <div
                            key={rp.roleId}
                            className="flex flex-col items-center gap-1"
                          >
                            <div className="text-xs text-[var(--text-secondary)] truncate w-16 text-center">
                              {rp.roleName}
                            </div>
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                rp.hasPermission
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {rp.hasPermission ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Difference indicator */}
                      <div className="flex items-center">
                        {item.allHave ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Todos
                          </Badge>
                        ) : item.noneHave ? (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            Ninguno
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                            Mixto
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {selectedRolesData.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <ArrowLeftRight className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            Selecciona roles para comparar
          </h3>
          <p className="text-[var(--text-secondary)]">
            Escoge hasta 4 roles de la lista superior para ver sus diferencias y similitudes
          </p>
        </motion.div>
      )}
    </div>
  );
}