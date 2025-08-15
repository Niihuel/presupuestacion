/**
 * Componente RoleManagement
 * 
 * Gestión completa de roles y permisos del sistema
 */

import { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Key,
  Search,
  Filter,
  Settings,
  Check,
  X,
  AlertCircle,
  Info,
  Eye,
  UserPlus,
  Save,
  RefreshCw
} from 'lucide-react';
import useAdminHook from '@compartido/hooks/useAdminHook';
import { useNotifications } from '@compartido/hooks/useNotificaciones';

const RoleManagement = () => {
  const { 
    useGetRoles, 
    useCreateRole, 
    useUpdateRole, 
    useDeleteRole,
    usePermissions,
    useRolePermissions,
    useUpdateRolePermissions
  } = useAdminHook();
  const notify = useNotifications();

  const { data: roles = [], isLoading, refetch } = useGetRoles();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const updatePermissionsMutation = useUpdateRolePermissions();
  const { data: allPermissions = [] } = usePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const { data: rolePerms = [] } = useRolePermissions(selectedRole?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Permisos disponibles en el sistema
  const availablePermissions = [];

  // Filtrar roles
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener color del rol
  const getRoleColor = (roleName) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      user: 'bg-green-100 text-green-800 border-green-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[roleName] || 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Roles</h2>
          <p className="text-gray-600">Administra roles y permisos del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Rol
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Lista de roles */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron roles que coincidan con tu búsqueda' : 'No hay roles registrados'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRoles.map((role) => (
              <div key={role.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${getRoleColor(role.name)}`}>
                        <Shield className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 capitalize">
                          {role.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role.name)}`}>
                          {role.user_count || 0} usuarios
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mt-1">
                        {role.description}
                      </p>
                      
                      {role.permissions && role.permissions.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <Key className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {role.permissions.length} permisos asignados
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {role.permissions.slice(0, 4).map(permission => (
                              <span 
                                key={permission}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                {availablePermissions.find(p => p.id === permission)?.name || permission}
                              </span>
                            ))}
                            {role.permissions.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{role.permissions.length - 4} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setShowPermissionsModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                      title="Gestionar permisos"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar rol"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    {role.name !== 'admin' && (
                      <button
                        onClick={() => {
                          setSelectedRole(role);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar rol"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear/editar rol */}
      {showCreateModal && (
        <RoleModal
          role={selectedRole}
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRole(null);
          }}
          onSave={async (roleData) => {
            if (selectedRole) {
              await updateRoleMutation.mutateAsync({ 
                roleId: selectedRole.id, 
                roleData 
              });
            } else {
              await createRoleMutation.mutateAsync(roleData);
            }
            refetch();
          }}
          isLoading={createRoleMutation.isLoading || updateRoleMutation.isLoading}
        />
      )}

      {/* Modal para gestionar permisos */}
      {showPermissionsModal && selectedRole && (
        <PermissionsModal
          role={selectedRole}
          availablePermissions={allPermissions.length ? allPermissions : availablePermissions}
          currentPermissions={rolePerms}
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
          }}
          onSave={async (permissions) => {
            try {
              await updatePermissionsMutation.mutateAsync({ roleId: selectedRole.id, permissions });
              notify.success('Permisos actualizados');
              refetch();
            } catch (e) {
              notify.error('No se pudieron actualizar los permisos');
            }
          }}
          isLoading={updatePermissionsMutation.isLoading}
        />
      )}

      {/* Modal de vista de permisos del rol (solo lectura) */}
      {selectedRole && !showPermissionsModal && (
        <RoleViewModal
          role={selectedRole}
          isOpen={false}
        />
      )}

      {/* Modal para confirmar eliminación */}
      {showDeleteModal && selectedRole && (
        <DeleteRoleModal
          role={selectedRole}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedRole(null);
          }}
          onConfirm={async () => {
            await deleteRoleMutation.mutateAsync(selectedRole.id);
            refetch();
          }}
          isLoading={deleteRoleMutation.isLoading}
        />
      )}
    </div>
  );
};

// Componente RoleModal para crear/editar roles
const RoleModal = ({ role, isOpen, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'purple'
  });
  const [errors, setErrors] = useState({});

  // Cargar datos del rol
  useState(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        color: role.color || 'purple'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: 'purple'
      });
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name.trim()) {
      setErrors({ name: 'El nombre es requerido' });
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">
            {role ? 'Editar Rol' : 'Nuevo Rol'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del rol *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ej: manager, editor, viewer"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              placeholder="Describe las responsabilidades de este rol..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente PermissionsModal para gestionar permisos
const PermissionsModal = ({ role, availablePermissions, currentPermissions = [], isOpen, onClose, onSave, isLoading }) => {
  const [selectedPermissions, setSelectedPermissions] = useState(new Map()); // permissionId -> {allow, scope}

  // Cargar permisos actuales del rol desde backend
  useState(() => {
    const map = new Map();
    (currentPermissions || []).forEach(p => {
      map.set(p.permissionId, { allow: !!p.allow, scope: p.scope || null });
    });
    setSelectedPermissions(map);
  }, [role, currentPermissions]);

  const togglePermission = (permissionId) => {
    const map = new Map(selectedPermissions);
    if (map.has(permissionId)) {
      map.delete(permissionId);
    } else {
      map.set(permissionId, { allow: true, scope: null });
    }
    setSelectedPermissions(map);
  };

  const toggleAllow = (permissionId) => {
    const map = new Map(selectedPermissions);
    const cur = map.get(permissionId) || { allow: true, scope: null };
    map.set(permissionId, { ...cur, allow: !cur.allow });
    setSelectedPermissions(map);
  };

  const handleSubmit = async () => {
    try {
      const payload = Array.from(selectedPermissions.entries()).map(([permissionId, cfg]) => ({ permissionId, allow: !!cfg.allow, scope: cfg.scope || null }));
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  };

  if (!isOpen) return null;

  // Agrupar permisos por módulo
  const groupedPermissions = (availablePermissions || []).reduce((acc, permission) => {
    const key = permission.module || 'general';
    if (!acc[key]) acc[key] = [];
    // Etiqueta en español para la acción
    const actionMap = { create: 'crear', read: 'ver', update: 'actualizar', delete: 'eliminar', approve: 'aprobar', export: 'exportar', view: 'ver', price: 'precio' };
    permission._moduleLabel = key
      .replace(/^users$/, 'usuarios')
      .replace(/^projects$/, 'proyectos')
      .replace(/^quotations$/, 'presupuestos')
      .replace(/^materials$/, 'materiales')
      .replace(/^reports$/, 'reportes')
      .replace(/^prices$/, 'precios')
      .replace(/^system$/, 'sistema')
      .replace(/^admin$/, 'administración');
    permission._actionLabel = actionMap[permission.action] || permission.action;
    acc[key].push(permission);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">
            Permisos para: {role.name}
          </h3>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-3">{(permissions[0]?._moduleLabel) || category}</h4>
                <div className="space-y-2">
                  {permissions.map(permission => {
                    const state = selectedPermissions.get(permission.id);
                    const checked = !!state;
                    const allow = state?.allow ?? true;
                    return (
                      <div key={permission.id} className="flex items-center justify-between py-1">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {permission._actionLabel}
                          </span>
                        </label>
                        {checked && (
                          <div className="flex items-center gap-3">
                            <label className="flex items-center text-xs">
                              <input type="checkbox" className="h-4 w-4 mr-1" checked={allow} onChange={() => toggleAllow(permission.id)} />
                              allow
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar Permisos'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente DeleteRoleModal para confirmar eliminación
const DeleteRoleModal = ({ role, isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">
              Eliminar Rol
            </h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar el rol "{role.name}"? 
            Esta acción no se puede deshacer y todos los usuarios con este rol 
            perderán sus permisos asociados.
          </p>
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de vista solo lectura de permisos del rol
const RoleViewModal = ({ role, isOpen }) => {
  if (!isOpen || !role) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Permisos del rol: {role.name}</h3>
        <p className="text-sm text-gray-600">Consulta rápida de permisos asignados sin editar.</p>
      </div>
    </div>
  );
};

export default RoleManagement;
