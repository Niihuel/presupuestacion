"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Check, 
  X, 
  Filter, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Settings,
  Users,
  Database,
  FileText,
  Truck,
  Building,
  Calculator,
  Calendar,
  ChevronDown,
  RotateCcw,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePermissionError } from "@/hooks/use-permission-error";

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

interface PermissionMatrixProps {
  roles: Role[];
  permissions: Record<string, Permission[]>;
  selectedPermissions: string[];
  onPermissionToggle: (permissionId: string) => void;
  onBulkAssign: (permissionIds: string[]) => void;
  onSave: () => void;
  selectedRoleId?: string;
  loading?: boolean;
}

// Resource icons mapping
const resourceIcons: Record<string, any> = {
  dashboard: Calculator,
  budgets: FileText,
  projects: Building,
  customers: Users,
  materials: Database,
  pieces: Database,
  users: Users,
  system: Settings,
  plants: Building,
  molds: Database,
  designers: Users,
  trucks: Truck,
  calendar: Calendar,
  parameters: Settings,
  permissions: Shield,
  roles: Shield
};

// Action colors mapping
const actionColors: Record<string, string> = {
  view: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  create: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  edit: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  approve: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  export: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  backup: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  restore: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
};

export function PermissionMatrix({
  roles,
  permissions,
  selectedPermissions,
  onPermissionToggle,
  onBulkAssign,
  onSave,
  selectedRoleId,
  loading = false
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [matrixView, setMatrixView] = useState<"grid" | "compact">("grid");
  
  // Permission error handling
  const { handlePermissionError, PermissionErrorModal } = usePermissionError();

  // Get friendly resource names
  const getResourceDisplayName = useCallback((resource: string): string => {
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
      roles: "Roles",
      reports: "Reportes",
      settings: "Configuración",
      audit: "Auditoría",
      notifications: "Notificaciones",
      inventory: "Inventario",
      finance: "Finanzas",
      hr: "Recursos Humanos",
      production: "Producción",
      quality: "Calidad",
      maintenance: "Mantenimiento",
      suppliers: "Proveedores",
      orders: "Pedidos",
      invoices: "Facturas",
      payments: "Pagos",
      contracts: "Contratos",
      documents: "Documentos",
      templates: "Plantillas",
      workflows: "Flujos de Trabajo",
      approvals: "Aprobaciones",
      analytics: "Análisis",
      statistics: "Estadísticas",
      backups: "Respaldos",
      logs: "Registros",
      security: "Seguridad",
      config: "Configuración",
      apis: "APIs",
      integrations: "Integraciones",
      exports: "Exportaciones",
      imports: "Importaciones"
    };
    return resourceNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
  }, []);

  // Get friendly action names
  const getActionDisplayName = useCallback((action: string): string => {
    const actionNames: Record<string, string> = {
      view: "Ver",
      read: "Leer",
      create: "Crear",
      add: "Añadir",
      edit: "Editar",
      update: "Actualizar",
      modify: "Modificar",
      delete: "Eliminar",
      remove: "Remover",
      approve: "Aprobar",
      reject: "Rechazar",
      export: "Exportar",
      import: "Importar",
      backup: "Respaldar",
      restore: "Restaurar",
      print: "Imprimir",
      download: "Descargar",
      upload: "Subir",
      send: "Enviar",
      receive: "Recibir",
      assign: "Asignar",
      unassign: "Desasignar",
      manage: "Gestionar",
      configure: "Configurar",
      monitor: "Monitorear",
      audit: "Auditar",
      execute: "Ejecutar",
      run: "Ejecutar",
      schedule: "Programar",
      cancel: "Cancelar",
      suspend: "Suspender",
      resume: "Reanudar",
      lock: "Bloquear",
      unlock: "Desbloquear",
      archive: "Archivar",
      unarchive: "Desarchivar",
      duplicate: "Duplicar",
      copy: "Copiar",
      move: "Mover",
      share: "Compartir",
      publish: "Publicar",
      unpublish: "Despublicar",
      enable: "Habilitar",
      disable: "Deshabilitar",
      validate: "Validar",
      process: "Procesar",
      complete: "Completar",
      review: "Revisar",
      analyze: "Analizar"
    };
    return actionNames[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }, []);

  // Filter permissions based on search and filters
  const filteredPermissions = useMemo(() => {
    const filtered: Record<string, Permission[]> = {};
    
    Object.entries(permissions).forEach(([resource, perms]) => {
      const resourceDisplayName = getResourceDisplayName(resource);
      
      if (selectedResource && resource !== selectedResource) return;
      
      const filteredPerms = perms.filter(perm => {
        if (selectedAction && perm.action !== selectedAction) return false;
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            resourceDisplayName.toLowerCase().includes(query) ||
            getActionDisplayName(perm.action).toLowerCase().includes(query) ||
            perm.description?.toLowerCase().includes(query)
          );
        }
        
        return true;
      });
      
      if (filteredPerms.length > 0) {
        filtered[resource] = filteredPerms;
      }
    });
    
    return filtered;
  }, [permissions, searchQuery, selectedResource, selectedAction, getResourceDisplayName, getActionDisplayName]);

  // Get all unique actions
  const allActions = useMemo(() => {
    const actions = new Set<string>();
    Object.values(permissions).forEach(perms => {
      perms.forEach(perm => actions.add(perm.action));
    });
    return Array.from(actions).sort();
  }, [permissions]);

  // Bulk operations
  const handleSelectAll = useCallback(() => {
    const allPermissionIds = Object.values(filteredPermissions)
      .flat()
      .map(p => p.id);
    onBulkAssign(allPermissionIds);
    toast.success(`Seleccionados ${allPermissionIds.length} permisos`);
  }, [filteredPermissions, onBulkAssign]);

  const handleClearAll = useCallback(() => {
    onBulkAssign([]);
    toast.success("Permisos deseleccionados");
  }, [onBulkAssign]);

  const selectedRole = selectedRoleId ? roles.find(r => r.id === selectedRoleId) : null;
  const totalPermissions = Object.values(permissions).flat().length;
  const selectedCount = selectedPermissions.length;
  const completionPercentage = (selectedCount / totalPermissions) * 100;

  return (
    <div className="space-y-6">
      {/* Header with Role Info */}
      {selectedRole && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                <Shield className="h-6 w-6 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Permisos para: {selectedRole.name}
                </h2>
                <p className="text-[var(--text-secondary)] mt-1">
                  {selectedRole.description || "Configurar permisos para este rol"}
                </p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="text-right">
              <div className="text-sm text-[var(--text-secondary)] mb-1">
                {selectedCount} de {totalPermissions} permisos
              </div>
              <div className="w-32 h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader className="pb-4">
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

              {/* Resource filter */}
              <select
                value={selectedResource || ""}
                onChange={(e) => setSelectedResource(e.target.value || null)}
                className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-primary)] text-sm"
              >
                <option value="">Todos los recursos</option>
                {Object.keys(permissions).map(resource => (
                  <option key={resource} value={resource}>
                    {getResourceDisplayName(resource)}
                  </option>
                ))}
              </select>

              {/* Action filter */}
              <select
                value={selectedAction || ""}
                onChange={(e) => setSelectedAction(e.target.value || null)}
                className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-primary)] text-sm"
              >
                <option value="">Todas las acciones</option>
                {allActions.map(action => (
                  <option key={action} value={action}>
                    {getActionDisplayName(action)}
                  </option>
                ))}
              </select>

              {/* Clear filters */}
              {(searchQuery || selectedResource || selectedAction) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedResource(null);
                    setSelectedAction(null);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            {/* Bulk actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={loading}
              >
                <Check className="h-4 w-4 mr-1" />
                Seleccionar todo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Deseleccionar todo
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Permission Matrix */}
      <div className="space-y-4">
        {Object.entries(filteredPermissions).map(([resource, perms]) => {
          const ResourceIcon = resourceIcons[resource] || Database;
          
          return (
            <motion.div
              key={resource}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                  <ResourceIcon className="h-5 w-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {getResourceDisplayName(resource)}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {perms.length} permiso{perms.length !== 1 ? 's' : ''} disponible{perms.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {/* Resource-level actions */}
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const resourcePermIds = perms.map(p => p.id);
                      onBulkAssign([...selectedPermissions.filter(id => !resourcePermIds.includes(id)), ...resourcePermIds]);
                    }}
                    disabled={loading}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const resourcePermIds = perms.map(p => p.id);
                      onBulkAssign(selectedPermissions.filter(id => !resourcePermIds.includes(id)));
                    }}
                    disabled={loading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Ninguno
                  </Button>
                </div>
              </div>

              {/* Permissions grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {perms.map((permission) => {
                  const isSelected = selectedPermissions.includes(permission.id);
                  const actionColor = actionColors[permission.action] || actionColors.view;
                  
                  return (
                    <motion.div
                      key={permission.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => onPermissionToggle(permission.id)}
                        disabled={loading}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                          "hover:shadow-lg hover:border-[var(--accent-primary)]/30",
                          isSelected
                            ? "bg-[var(--accent-primary)]/5 border-[var(--accent-primary)] shadow-md"
                            : "bg-[var(--surface-primary)] border-[var(--surface-border)] hover:bg-[var(--surface-hover)]"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge className={cn("text-xs font-medium", actionColor)}>
                            {getActionDisplayName(permission.action)}
                          </Badge>
                          
                          <motion.div
                            animate={{ scale: isSelected ? 1.2 : 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {isSelected ? (
                              <Check className="h-5 w-5 text-[var(--accent-primary)]" />
                            ) : (
                              <div className="h-5 w-5 rounded border-2 border-[var(--surface-border)]" />
                            )}
                          </motion.div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-medium text-[var(--text-primary)] text-sm">
                            {permission.description || `${getActionDisplayName(permission.action)} ${getResourceDisplayName(resource)}`}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {resource}.{permission.action}
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Save Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between glass-card p-4"
      >
        <div className="text-sm text-[var(--text-secondary)]">
          {selectedCount} permiso{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Shield className="h-4 w-4" />
                </motion.div>
                Guardando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Guardar Permisos
              </>
            )}
          </Button>
        </div>
      </motion.div>
      
      {/* Permission Error Modal */}
      <PermissionErrorModal />
    </div>
  );
}