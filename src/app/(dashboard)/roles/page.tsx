"use client";
import useSWR from "swr";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as React from "react";
import { Loader2, Users, Shield, CheckCircle2, BarChart3, GitCompare, Settings, Layers, Zap, Eye, Plus, History, Edit, Trash2 } from "lucide-react";
import { RoleAnalytics } from "@/components/roles/role-analytics";
import { RoleComparison } from "@/components/roles/role-comparison";
import { PermissionHistory } from "@/components/roles/permission-history";
import { motion } from "framer-motion";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";
import { PageTransition, SectionTransition } from "@/components/ui/page-transition";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

export default function RolesPage() {
  const [tab, setTab] = React.useState<"roles" | "gestionar_roles" | "analytics" | "history">("roles");
  const [q, setQ] = React.useState("");
  const { data: roles, mutate, error: rolesError } = useSWR(`/api/roles`, fetcher);
  const { data: groupedPerms, error: permsError } = useSWR(`/api/permissions`, fetcher);
  const { data: usersResponse } = useSWR(`/api/users`, fetcher);
  
  // Extract users array from paginated response
  const users = usersResponse?.items || [];
  
  // Debug API data
  React.useEffect(() => {
    if (roles) {
      console.log('Roles data loaded:', roles.length, 'roles');
      console.log('First role sample:', roles[0]);
    }
  }, [roles]);
  
  React.useEffect(() => {
    if (users) {
      console.log('Users data loaded:', users.length, 'users');
      console.log('First user sample:', users[0]);
    }
  }, [users]);
  const [selected, setSelected] = React.useState<string>("");
  const [selectedPerms, setSelectedPerms] = React.useState<string[]>([]);
  const [openCreate, setOpenCreate] = React.useState(false);
  const [viewRole, setViewRole] = React.useState<any | null>(null);
  const [editRole, setEditRole] = React.useState<any | null>(null);
  const [deleteRole, setDeleteRole] = React.useState<any | null>(null);
  const [openPermissionsModal, setOpenPermissionsModal] = React.useState(false);
  const [loadingPermissions, setLoadingPermissions] = React.useState(false);
  
  // Debug modal states
  React.useEffect(() => {
    console.log('Modal states changed:', {
      openCreate,
      viewRole: !!viewRole,
      editRole: !!editRole,
      deleteRole: !!deleteRole,
      openPermissionsModal
    });
  }, [openCreate, viewRole, editRole, deleteRole, openPermissionsModal]);
  
  // Permission error handling
  const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
  
  // Handle permission errors
  React.useEffect(() => {
    if (rolesError) {
      handlePermissionError(rolesError, "Ver roles");
    }
  }, [rolesError, handlePermissionError]);
  
  React.useEffect(() => {
    if (permsError) {
      handlePermissionError(permsError, "Ver permisos");
    }
  }, [permsError, handlePermissionError]);

  // Fetch role-specific permissions when a role is selected for editing
  React.useEffect(() => {
    if (!selected || !openPermissionsModal) return;
    
    const fetchRolePermissions = async () => {
      setLoadingPermissions(true);
      try {
        const response = await axios.get(`/api/roles/${selected}/permissions`);
        const rolePermissions = response.data;
        setSelectedPerms(rolePermissions.map((p: any) => p.id));
      } catch (error) {
        toast.error('Error al cargar permisos del rol');
        setSelectedPerms([]);
      } finally {
        setLoadingPermissions(false);
      }
    };
    
    fetchRolePermissions();
  }, [selected, openPermissionsModal]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload = Object.fromEntries(fd.entries());
    try {
      await axios.post(`/api/roles`, payload);
      toast.success("Rol creado correctamente");
      (e.currentTarget as HTMLFormElement).reset();
      mutate();
      setOpenCreate(false);
    } catch (error) {
      handlePermissionError(error, "Crear rol");
    }
  }

  async function onSavePerms() {
    if (!selected) {
      toast.error('Error: No hay rol seleccionado');
      return;
    }
    
    const role = roles?.find((r: any) => r.id === selected);
    if (!role) {
      toast.error('Error: Rol no encontrado');
      return;
    }
    
    try {
      console.log('Saving permissions for role:', role.name, 'Permissions:', selectedPerms);
      
      await axios.put(`/api/roles/${selected}/permissions`, { 
        permissionIds: selectedPerms 
      });
      
      toast.success(`Permisos actualizados correctamente para ${role.name}`);
      mutate(); // Refresh the roles data
      
      // Close modal and reset state
      setOpenPermissionsModal(false);
      setSelected("");
      setSelectedPerms([]);
      
    } catch (error) {
      console.error('Error saving permissions:', error);
      handlePermissionError(error, "Actualizar permisos");
    }
  }

  function togglePerm(id: string) {
    console.log('Toggling permission:', id);
    setSelectedPerms((prev) => {
      const isCurrentlySelected = prev.includes(id);
      const newSelection = isCurrentlySelected 
        ? prev.filter(x => x !== id) 
        : prev.concat(id);
      
      console.log('Permission toggle result:', {
        permissionId: id,
        wasSelected: isCurrentlySelected,
        newState: !isCurrentlySelected,
        totalSelected: newSelection.length
      });
      
      return newSelection;
    });
  }

  function openPermissionEditor(roleId: string) {
    console.log('openPermissionEditor called with roleId:', roleId);
    
    // Validate that we have the role ID and it exists
    if (!roleId) {
      toast.error('Error: ID de rol no válido');
      return;
    }
    
    const role = roles?.find((r: any) => r.id === roleId);
    if (!role) {
      toast.error('Error: Rol no encontrado');
      return;
    }
    
    console.log('Setting selected role:', role.name);
    setSelected(roleId);
    setSelectedPerms([]); // Reset permissions
    setOpenPermissionsModal(true);
    
    // Add a small delay to ensure state is set
    setTimeout(() => {
      console.log('Permission modal should be open now');
    }, 100);
  }

  // Helper function to get friendly resource names
  function getResourceDisplayName(resource: string): string {
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
  }

  // Helper function to get friendly action names
  function getActionDisplayName(action: string): string {
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
  }

  const selectedRole = roles?.find((r: any) => r.id === selected);

  return (
    <PageTransition>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                <Shield className="h-6 w-6 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Roles y Permisos</h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  Administra roles, permisos y seguridad del sistema
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <SectionTransition delay={0.1} className="mb-6">
          <Card>
            <CardContent className="p-2">
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={tab === "roles" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTab("roles")}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Roles
                </Button>
                <Button
                  variant={tab === "analytics" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTab("analytics")}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analíticas
                </Button>
                <Button
                  variant={tab === "history" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTab("history")}
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Historial
                </Button>
              </div>
            </CardContent>
          </Card>
        </SectionTransition>

        {/* Roles Tab */}
        {tab === "roles" && (
          <SectionTransition delay={0.2}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Roles del Sistema</h3>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={() => setOpenCreate(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nuevo Rol
                    </Button>
                  </motion.div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gestiona los roles y sus permisos asignados
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roles?.map((role: any, index: number) => (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{role.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {role.description || "Sin descripción"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {users.filter((u: any) => u.roleId === role.id).length} usuarios
                        </Badge>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewRole(role)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditRole(role)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissionEditor(role.id)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Settings className="h-3 w-3" />
                            Permisos
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteRole(role)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {(!roles || roles.length === 0) && (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay roles configurados</h3>
                    <p className="text-muted-foreground mb-4">
                      Crea tu primer rol para comenzar a gestionar permisos
                    </p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button onClick={() => setOpenCreate(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear primer rol
                      </Button>
                    </motion.div>
                  </div>
                )}
              </CardContent>
            </Card>
          </SectionTransition>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && <RoleAnalytics roles={roles} users={users} />}

        {/* History Tab */}
        {tab === "history" && <PermissionHistory />}

        {/* Crear Rol Modal */}
        <UnifiedModal open={openCreate} onOpenChange={setOpenCreate} title="Crear Nuevo Rol" className="max-w-md">
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Rol *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej: Administrador, Editor, Visor"
                required
                className="mt-1"
                maxLength={50}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                placeholder="Describe el propósito de este rol"
                className="mt-1"
                maxLength={200}
              />
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Crear Rol
              </Button>
            </div>
          </form>
        </UnifiedModal>

        {/* Ver Rol Modal */}
        <UnifiedModal open={!!viewRole} onOpenChange={(o) => !o && setViewRole(null)} title={viewRole?.name || "Detalles del Rol"} className="max-w-md">
          {viewRole && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mt-1">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{viewRole.name}</h3>
                  <p className="text-muted-foreground">
                    {viewRole.description || "Sin descripción"}
                  </p>
                </div>
              </div>
              
              {/* Permissions List */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Permisos Asignados ({viewRole.permissions?.length || 0})
                </h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                  {viewRole.permissions?.length ? (
                    <div className="grid grid-cols-1 gap-1">
                      {viewRole.permissions.map((perm: any) => (
                        <div key={perm.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{perm.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center p-4">
                      No hay permisos asignados a este rol
                    </p>
                  )}
                </div>
              </div>
              
              {/* Statistics */}
              <div className="p-3 bg-[var(--surface-secondary)] rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-xs text-center">
                  <div>
                    <div className="font-semibold text-[var(--accent-primary)]">
                      {users.filter((u: any) => u.roleId === viewRole.id).length}
                    </div>
                    <div className="text-[var(--text-secondary)]">Usuarios</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--accent-primary)]">
                      {viewRole.permissions?.length || 0}
                    </div>
                    <div className="text-[var(--text-secondary)]">Permisos</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-3 border-t border-[var(--surface-border)]">
                <Button variant="outline" onClick={() => setViewRole(null)} className="flex-1">
                  Cerrar
                </Button>
                <Button 
                  onClick={() => {
                    setEditRole(viewRole);
                    setViewRole(null);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </UnifiedModal>

        {/* Editar Rol Modal */}
        <UnifiedModal open={!!editRole} onOpenChange={(o) => !o && setEditRole(null)} title="Editar Rol" className="max-w-md">
          {editRole && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const payload = Object.fromEntries(fd.entries());
              try {
                await axios.put(`/api/roles/${editRole.id}`, payload);
                toast.success("Rol actualizado correctamente");
                mutate();
                setEditRole(null);
              } catch (error) {
                handlePermissionError(error, "Actualizar rol");
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre del Rol *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editRole.name}
                  required
                  className="mt-1"
                  maxLength={50}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editRole.description ?? ''}
                  className="mt-1"
                  maxLength={200}
                />
              </div>
              
              {/* Statistics */}
              <div className="p-3 bg-[var(--surface-secondary)] rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-xs text-center">
                  <div>
                    <div className="font-semibold text-[var(--accent-primary)]">
                      {users.filter((u: any) => u.roleId === editRole.id).length}
                    </div>
                    <div className="text-[var(--text-secondary)]">Usuarios</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--accent-primary)]">
                      {editRole.permissions?.length || 0}
                    </div>
                    <div className="text-[var(--text-secondary)]">Permisos</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-3 border-t border-[var(--surface-border)]">
                <Button type="button" variant="outline" onClick={() => setEditRole(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </UnifiedModal>

        {/* Eliminar Rol Modal */}
        <UnifiedModal open={!!deleteRole} onOpenChange={(o) => !o && setDeleteRole(null)} title="Confirmar Eliminación" className="max-w-md">
          {deleteRole && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-200">¿Eliminar "{deleteRole.name}"?</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--surface-secondary)] rounded-lg text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {users.filter((u: any) => u.roleId === deleteRole.id).length}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">Usuarios afectados</div>
                </div>
                <div className="p-3 bg-[var(--surface-secondary)] rounded-lg text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {deleteRole.permissions?.length || 0}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">Permisos vinculados</div>
                </div>
              </div>
              
              {users.filter((u: any) => u.roleId === deleteRole.id).length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Advertencia:</strong> Hay usuarios asignados a este rol.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDeleteRole(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await axios.delete(`/api/roles/${deleteRole.id}`);
                      toast.success("Rol eliminado correctamente");
                      mutate();
                      setDeleteRole(null);
                    } catch (error) {
                      handlePermissionError(error, "Eliminar rol");
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </UnifiedModal>
        
        {/* Permission Error Modal */}
        <PermissionErrorModal />
      </div>
    </PageTransition>
  );
}
