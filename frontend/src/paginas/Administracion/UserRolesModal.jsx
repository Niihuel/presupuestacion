/**
 * Componente UserRolesModal
 * 
 * Modal para gestionar roles y permisos de usuarios específicos
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Shield, 
  Check,
  AlertCircle,
  Info,
  Clock,
  UserCheck,
  Key
} from 'lucide-react';
import useAdminHook from '@compartido/hooks/useAdminHook';
import { assignRoleToUser as assignSvc } from '@compartido/servicios/servicioAdmin.js';

const UserRolesModal = ({ 
  user = null, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const { useGetRoles } = useAdminHook();
  const { data: roles = [], isLoading: rolesLoading } = useGetRoles();

  const [selectedRole, setSelectedRole] = useState('');
  const [temporaryAccess, setTemporaryAccess] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar rol actual del usuario
  useEffect(() => {
    if (user && isOpen) {
      setSelectedRole(user.role || '');
      setTemporaryAccess(!!user.role_expiration);
      setExpirationDate(user.role_expiration ? user.role_expiration.split('T')[0] : '');
      setNotes(user.role_notes || '');
    } else if (!user && isOpen) {
      setSelectedRole('');
      setTemporaryAccess(false);
      setExpirationDate('');
      setNotes('');
    }
    setErrors({});
  }, [user, isOpen]);

  // Obtener información del rol seleccionado
  const selectedRoleInfo = roles.find(role => role.name === selectedRole);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!selectedRole) {
      newErrors.role = 'Selecciona un rol';
    }

    if (temporaryAccess && !expirationDate) {
      newErrors.expirationDate = 'Selecciona fecha de expiración';
    }

    if (temporaryAccess && expirationDate) {
      const expDate = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expDate <= today) {
        newErrors.expirationDate = 'La fecha debe ser futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const roleData = {
        role: selectedRole,
        temporaryAccess,
        expirationDate: temporaryAccess ? expirationDate : null,
        notes
      };

      await assignSvc(user.id, roles.find(r=>r.name===selectedRole)?.id);

      if (onSave) {
        onSave({ userId: user.id, roleData });
      }
      
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Error al asignar el rol' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener color del rol
  const getRoleColor = (roleName) => {
    const colors = {
      admin: 'text-red-600 bg-red-100',
      manager: 'text-blue-600 bg-blue-100',
      user: 'text-green-600 bg-green-100',
      viewer: 'text-gray-600 bg-gray-100'
    };
    return colors[roleName] || 'text-gray-600 bg-gray-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserCheck className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestionar Roles
                </h2>
                <p className="text-sm text-gray-600">
                  {user?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-6">
            {/* Error general */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{errors.submit}</span>
              </div>
            )}

            {/* Información actual */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Rol actual</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-gray-400 mr-2" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role)}`}>
                    {user?.role || 'Sin rol'}
                  </span>
                </div>
                {user?.role_expiration && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    Expira: {new Date(user.role_expiration).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Selección de rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuevo rol *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={rolesLoading || isSubmitting}
              >
                <option value="">Seleccionar rol...</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Información del rol seleccionado */}
            {selectedRoleInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {selectedRoleInfo.name}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedRoleInfo.description}
                    </p>
                    {selectedRoleInfo.permissions && selectedRoleInfo.permissions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-blue-600 mb-1">Permisos incluidos:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRoleInfo.permissions.slice(0, 3).map(permission => (
                            <span 
                              key={permission}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {permission}
                            </span>
                          ))}
                          {selectedRoleInfo.permissions.length > 3 && (
                            <span className="text-xs text-blue-600">
                              +{selectedRoleInfo.permissions.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Acceso temporal */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  id="temporaryAccess"
                  type="checkbox"
                  checked={temporaryAccess}
                  onChange={(e) => setTemporaryAccess(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  disabled={isSubmitting}
                />
                <label htmlFor="temporaryAccess" className="ml-2 text-sm font-medium text-gray-700">
                  Acceso temporal
                </label>
              </div>

              {temporaryAccess && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de expiración *
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Mínimo mañana
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                      errors.expirationDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.expirationDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.expirationDate}</p>
                  )}
                </div>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="Razón del cambio de rol, restricciones especiales, etc."
                disabled={isSubmitting}
              />
            </div>

            {/* Advertencia para roles sensibles */}
            {selectedRole === 'admin' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Atención</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      El rol de administrador otorga acceso completo al sistema. 
                      Asegúrate de que el usuario requiere estos permisos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isSubmitting || !selectedRole}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Asignar rol
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRolesModal;
