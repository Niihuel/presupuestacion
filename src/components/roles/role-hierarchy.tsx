"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitBranch, 
  Shield, 
  Users, 
  ArrowDown, 
  ArrowUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  GitBranch as Hierarchy,
  Crown,
  ChevronDown,
  ChevronRight,
  Layers,
  Link,
  Unlink,
  Move,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  parentRoleId?: string;
  level?: number;
  isSystem?: boolean;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface RoleHierarchyNode extends Role {
  children: RoleHierarchyNode[];
  inheritedPermissions: Permission[];
  ownPermissions: Permission[];
  totalUsers: number;
  isExpanded?: boolean;
}

interface RoleHierarchyProps {
  roles: Role[];
  permissions: Record<string, Permission[]>;
  users?: any[];
  onCreateRole: (roleData: Partial<Role>) => void;
  onUpdateRole: (roleId: string, updates: Partial<Role>) => void;
  onDeleteRole: (roleId: string) => void;
  onUpdateHierarchy: (parentId: string, childId: string) => void;
  onRemoveFromHierarchy: (roleId: string) => void;
}

export function RoleHierarchy({
  roles,
  permissions,
  users = [],
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onUpdateHierarchy,
  onRemoveFromHierarchy
}: RoleHierarchyProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [draggedRole, setDraggedRole] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");
  
  // UnifiedModals
  const [createUnifiedModalOpen, setCreateUnifiedModalOpen] = useState(false);
  const [editUnifiedModalOpen, setEditUnifiedModalOpen] = useState(false);
  const [inheritanceUnifiedModalOpen, setInheritanceUnifiedModalOpen] = useState(false);
  
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRoleParent, setNewRoleParent] = useState<string>("");

  // Build hierarchy tree
  const hierarchyTree = useMemo((): RoleHierarchyNode[] => {
    const roleMap = new Map<string, RoleHierarchyNode>();
    const allPermissions = Object.values(permissions).flat();
    
    // Create nodes
    roles.forEach(role => {
      const userCount = Array.isArray(users) ? users.filter(u => u.roleId === role.id).length : 0;
      
      roleMap.set(role.id, {
        ...role,
        children: [],
        inheritedPermissions: [],
        ownPermissions: role.permissions,
        totalUsers: userCount,
        isExpanded: expandedNodes.has(role.id)
      });
    });

    // Build tree structure and calculate inherited permissions
    const rootNodes: RoleHierarchyNode[] = [];
    
    roleMap.forEach(node => {
      if (node.parentRoleId && roleMap.has(node.parentRoleId)) {
        const parent = roleMap.get(node.parentRoleId)!;
        parent.children.push(node);
        
        // Calculate inherited permissions
        const inheritedPerms = [...parent.ownPermissions, ...parent.inheritedPermissions];
        node.inheritedPermissions = inheritedPerms.filter(perm => 
          !node.ownPermissions.some(ownPerm => ownPerm.id === perm.id)
        );
      } else {
        rootNodes.push(node);
      }
    });

    // Sort by level and name
    const sortNodes = (nodes: RoleHierarchyNode[]): RoleHierarchyNode[] => {
      return nodes.sort((a, b) => {
        if (a.isSystem && !b.isSystem) return -1;
        if (!a.isSystem && b.isSystem) return 1;
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: sortNodes(node.children)
      }));
    };

    return sortNodes(rootNodes);
  }, [roles, permissions, users, expandedNodes]);

  // Flatten tree for flat view
  const flattenedRoles = useMemo(() => {
    const flatten = (nodes: RoleHierarchyNode[], level = 0): (RoleHierarchyNode & { displayLevel: number })[] => {
      return nodes.reduce((acc, node) => {
        acc.push({ ...node, displayLevel: level });
        if (node.isExpanded && node.children.length > 0) {
          acc.push(...flatten(node.children, level + 1));
        }
        return acc;
      }, [] as (RoleHierarchyNode & { displayLevel: number })[]);
    };
    
    return flatten(hierarchyTree);
  }, [hierarchyTree]);

  const toggleExpanded = useCallback((roleId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  }, []);

  const handleDragStart = (roleId: string) => {
    setDraggedRole(roleId);
  };

  const handleDragOver = (e: React.DragEvent, roleId: string) => {
    e.preventDefault();
    setDropTarget(roleId);
  };

  const handleDragEnd = () => {
    if (draggedRole && dropTarget && draggedRole !== dropTarget) {
      onUpdateHierarchy(dropTarget, draggedRole);
      toast.success("Jerarquía actualizada");
    }
    setDraggedRole(null);
    setDropTarget(null);
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    
    onCreateRole({
      name: newRoleName,
      description: newRoleDescription,
      parentRoleId: newRoleParent || undefined,
      permissions: []
    });
    
    setCreateUnifiedModalOpen(false);
    setNewRoleName("");
    setNewRoleDescription("");
    setNewRoleParent("");
    toast.success("Rol creado exitosamente");
  };

  const getEffectivePermissions = (role: RoleHierarchyNode): Permission[] => {
    return [...role.inheritedPermissions, ...role.ownPermissions];
  };

  const getRoleLevel = (roleId: string): number => {
    const findLevel = (nodes: RoleHierarchyNode[], targetId: string, level = 0): number => {
      for (const node of nodes) {
        if (node.id === targetId) return level;
        const childLevel = findLevel(node.children, targetId, level + 1);
        if (childLevel !== -1) return childLevel;
      }
      return -1;
    };
    
    return findLevel(hierarchyTree, roleId);
  };

  const canDropOn = (draggedId: string, targetId: string): boolean => {
    // Prevent dropping on self or descendants
    const findInSubtree = (nodes: RoleHierarchyNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) return true;
        if (findInSubtree(node.children, targetId)) return true;
      }
      return false;
    };
    
    const draggedNode = hierarchyTree.find(n => n.id === draggedId);
    if (!draggedNode) return false;
    
    return !findInSubtree([draggedNode], targetId);
  };

  const renderRoleNode = (role: RoleHierarchyNode, level = 0) => {
    const hasChildren = role.children.length > 0;
    const effectivePermissions = getEffectivePermissions(role);
    const isSelected = selectedRole === role.id;
    const isDragTarget = dropTarget === role.id;
    const isDragging = draggedRole === role.id;

    return (
      <motion.div
        key={role.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "group relative",
          isDragging && "opacity-50",
          isDragTarget && "bg-blue-50 dark:bg-blue-900/20"
        )}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div
          draggable
          onDragStart={() => handleDragStart(role.id)}
          onDragOver={(e) => handleDragOver(e, role.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
            isSelected 
              ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]" 
              : "bg-[var(--surface-primary)] border-[var(--surface-border)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent-primary)]/30",
            role.isSystem && "border-dashed"
          )}
          onClick={() => setSelectedRole(role.id)}
        >
          {/* Hierarchy controls */}
          <div className="flex items-center gap-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(role.id);
                }}
                className="p-1 h-6 w-6"
              >
                {role.isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {/* Role icon */}
            <div className={cn(
              "p-2 rounded-lg",
              role.isSystem ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
              level === 0 ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
              level === 1 ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
              "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            )}>
              {role.isSystem ? <Crown className="h-4 w-4" /> :
               level === 0 ? <Shield className="h-4 w-4" /> :
               <Users className="h-4 w-4" />}
            </div>
          </div>

          {/* Role info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[var(--text-primary)] truncate">
                {role.name}
              </h3>
              {role.isSystem && (
                <Badge variant="outline" className="text-xs">
                  Sistema
                </Badge>
              )}
              {level > 0 && (
                <Badge variant="outline" className="text-xs">
                  Nivel {level + 1}
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] truncate">
              {role.description || "Sin descripción"}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
              <span>{role.totalUsers} usuarios</span>
              <span>{role.ownPermissions.length} permisos propios</span>
              {role.inheritedPermissions.length > 0 && (
                <span>{role.inheritedPermissions.length} heredados</span>
              )}
              <span>{effectivePermissions.length} total</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Edit className="h-3 w-3" />
            </Button>
            {!role.isSystem && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {role.isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {role.children.map(child => renderRoleNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20">
              <Hierarchy className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Jerarquía de Roles
              </h2>
              <p className="text-[var(--text-secondary)] mt-1">
                Gestión visual de herencia y relaciones entre roles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex bg-[var(--surface-secondary)] rounded-lg p-1">
              <Button
                variant={viewMode === "tree" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("tree")}
                className="gap-2"
              >
                <GitBranch className="h-4 w-4" />
                Vista de Árbol
              </Button>
              <Button
                variant={viewMode === "flat" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("flat")}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                Vista de Lista
              </Button>
            </div>

            <Button onClick={() => setCreateUnifiedModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Role hierarchy */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main hierarchy view */}
        <div className="lg:col-span-2 space-y-3">
          {viewMode === "tree" ? (
            hierarchyTree.map(role => renderRoleNode(role))
          ) : (
            flattenedRoles.map(role => renderRoleNode(role, role.displayLevel))
          )}
        </div>

        {/* Role details sidebar */}
        <div className="space-y-4">
          {selectedRole ? (
            (() => {
              const role = [...hierarchyTree, ...hierarchyTree.flatMap(r => r.children)]
                .find(r => r.id === selectedRole);
              
              if (!role) return null;
              
              const effectivePermissions = getEffectivePermissions(role);
              const level = getRoleLevel(role.id);
              
              return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <Card className="glass-card">
                    <CardHeader>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Detalles del Rol
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Nombre</Label>
                        <div className="text-lg font-semibold">{role.name}</div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Descripción</Label>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {role.description || "Sin descripción"}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Nivel jerárquico</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Nivel {level + 1}</Badge>
                          {role.parentRoleId && (
                            <span className="text-xs text-[var(--text-secondary)]">
                              Hereda de: {roles.find(r => r.id === role.parentRoleId)?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 rounded-lg bg-[var(--surface-secondary)]">
                          <div className="text-lg font-bold">{role.totalUsers}</div>
                          <div className="text-xs text-[var(--text-secondary)]">Usuarios</div>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--surface-secondary)]">
                          <div className="text-lg font-bold">{effectivePermissions.length}</div>
                          <div className="text-xs text-[var(--text-secondary)]">Permisos</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <h4 className="font-medium">Permisos Efectivos</h4>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {role.ownPermissions.length > 0 && (
                          <div>
                            <Label className="text-xs text-green-600">Propios ({role.ownPermissions.length})</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.ownPermissions.slice(0, 5).map(perm => (
                                <Badge key={perm.id} className="text-xs bg-green-100 text-green-700">
                                  {perm.action}
                                </Badge>
                              ))}
                              {role.ownPermissions.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.ownPermissions.length - 5} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {role.inheritedPermissions.length > 0 && (
                          <div>
                            <Label className="text-xs text-blue-600">Heredados ({role.inheritedPermissions.length})</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.inheritedPermissions.slice(0, 5).map(perm => (
                                <Badge key={perm.id} className="text-xs bg-blue-100 text-blue-700">
                                  {perm.action}
                                </Badge>
                              ))}
                              {role.inheritedPermissions.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.inheritedPermissions.length - 5} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()
          ) : (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <Hierarchy className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <h3 className="font-medium text-[var(--text-primary)] mb-2">
                  Selecciona un rol
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Haz clic en un rol para ver sus detalles y gestionar su jerarquía
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Role UnifiedModal */}
      <UnifiedModal
        open={createUnifiedModalOpen}
        onOpenChange={setCreateUnifiedModalOpen}
        title="Crear Nuevo Rol"
      >
        <div className="space-y-4">
          <div>
            <Label>Nombre del rol</Label>
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Ej: Supervisor de Ventas"
            />
          </div>
          
          <div>
            <Label>Descripción</Label>
            <Input
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              placeholder="Descripción del rol (opcional)"
            />
          </div>
          
          <div>
            <Label>Rol padre (opcional)</Label>
            <select
              value={newRoleParent}
              onChange={(e) => setNewRoleParent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-primary)]"
            >
              <option value="">Sin rol padre</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setCreateUnifiedModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()}>
              Crear Rol
            </Button>
          </div>
        </div>
      </UnifiedModal>
    </div>
  );
}