/**
 * Componente UserManagement
 * Gestión completa de usuarios del sistema con CRUD, roles y permisos
 */

import { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Key
} from 'lucide-react';

import useAdminHook from '@compartido/hooks/useAdminHook';

// Componentes modales
import UserModal from './UserModal';
import UserRolesModal from './UserRolesModal';
import DialogoConfirmacion from '@compartido/components/DialogoConfirmacion';

const UserManagement = () => {
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Estados de modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Filtros para la consulta
  const filters = useMemo(() => ({
    search: searchTerm,
    role: roleFilter,
    status: statusFilter,
    page: currentPage,
    limit: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder
  }), [searchTerm, roleFilter, statusFilter, currentPage, pageSize, sortBy, sortOrder]);

  // Hooks de datos
  const { 
    useGetUsers, 
    useCreateUser, 
    useUpdateUser, 
    useDeleteUser,
    useToggleUserStatus,
    useChangeUserPassword 
  } = useAdminHook();
  
  const { data: usersData, isLoading, error } = useGetUsers(filters);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const toggleUserStatusMutation = useToggleUserStatus();
  const changeUserPasswordMutation = useChangeUserPassword();

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = Math.ceil(totalUsers / pageSize);

  // Handlers
  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleManageRoles = (user) => {
    setSelectedUser(user);
    setShowRolesModal(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await toggleUserStatusMutation.mutateAsync({ userId: user.id, status: newStatus });
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'activate':
        for (const userId of selectedUsers) {
          await toggleUserStatusMutation.mutateAsync({ userId, status: 'active' });
        }
        break;
      case 'deactivate':
        for (const userId of selectedUsers) {
          await toggleUserStatusMutation.mutateAsync({ userId, status: 'inactive' });
        }
        break;
      case 'delete':
        if (window.confirm(`¿Eliminar ${selectedUsers.length} usuarios seleccionados?`)) {
          for (const userId of selectedUsers) {
            await deleteUserMutation.mutateAsync(userId);
          }
        }
        break;
    }
    setSelectedUsers([]);
  };

  // Componente de controles
  const Controls = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuarios por nombre, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filtro por rol */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="manager">Gerente</option>
          <option value="user">Usuario</option>
          <option value="viewer">Visualizador</option>
        </select>

        {/* Filtro por estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="pending">Pendientes</option>
        </select>

        {/* Botón crear usuario */}
        <button
          onClick={handleCreateUser}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Acciones masivas */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <span className="text-sm font-medium text-purple-700">
            {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''} seleccionado{selectedUsers.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
            >
              Activar
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200"
            >
              Desactivar
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Componente de la tabla de usuarios
  const UsersTable = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 border-b"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 border-b"></div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar usuarios</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último acceso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <UserRow 
                  key={user.id} 
                  user={user}
                  selected={selectedUsers.includes(user.id)}
                  onSelect={() => handleSelectUser(user.id)}
                  onEdit={handleEditUser}
                  onView={handleViewUser}
                  onManageRoles={handleManageRoles}
                  onDelete={handleDeleteUser}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || roleFilter || statusFilter
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'Comienza creando tu primer usuario'
              }
            </p>
            <button
              onClick={handleCreateUser}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Usuario
            </button>
          </div>
        )}
      </div>
    );
  };

  // Componente de fila de usuario
  const UserRow = ({ user, selected, onSelect, onEdit, onView, onManageRoles, onDelete, onToggleStatus }) => {
    const [showActions, setShowActions] = useState(false);

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-sm font-medium text-purple-600">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
            user.role === 'user' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.role === 'admin' ? 'Administrador' :
             user.role === 'manager' ? 'Gerente' :
             user.role === 'user' ? 'Usuario' : 'Visualizador'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            user.status === 'active' ? 'bg-green-100 text-green-800' :
            user.status === 'inactive' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {user.status === 'active' ? 'Activo' :
             user.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-[15] border">
                <div className="py-1">
                  <button
                    onClick={() => { onView(user); setShowActions(false); }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalles
                  </button>
                  <button
                    onClick={() => { onEdit(user); setShowActions(false); }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </button>
                  <button
                    onClick={() => { onManageRoles(user); setShowActions(false); }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Gestionar roles
                  </button>
                  <button
                    onClick={() => { onToggleStatus(user); setShowActions(false); }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    {user.status === 'active' ? (
                      <>
                        <UserX className="w-4 h-4 mr-2" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Activar
                      </>
                    )}
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => { onDelete(user); setShowActions(false); }}
                    className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Paginación
  const PaginacionLocal = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
              {' '}a{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalUsers)}</span>
              {' '}de{' '}
              <span className="font-medium">{totalUsers}</span>
              {' '}resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2);
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Controls />

      {/* Tabla de usuarios */}
      <UsersTable />

      {/* Paginación */}
      <PaginacionLocal />

      {/* Modal de usuario */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          onSave={selectedUser ? updateUserMutation.mutateAsync : createUserMutation.mutateAsync}
          isLoading={selectedUser ? updateUserMutation.isPending : createUserMutation.isPending}
          readOnly={!!selectedUser && !updateUserMutation.isPending}
        />
      )}

      {/* Modal de roles */}
      {showRolesModal && (
        <UserRolesModal
          user={selectedUser}
          isOpen={showRolesModal}
          onClose={() => setShowRolesModal(false)}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      {showDeleteDialog && (
        <DialogoConfirmacion
          title="¿Eliminar usuario?"
          message={`¿Estás seguro de que quieres eliminar al usuario "${userToDelete?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar usuario"
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
          variant="danger"
          isLoading={deleteUserMutation.isPending}
        />
      )}
    </div>
  );
};

export default UserManagement;
