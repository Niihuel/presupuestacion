/**
 * Componente UserModal
 * 
 * Modal para crear y editar usuarios con formulario completo
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Camera,
  Key
} from 'lucide-react';
import useAdminHook from '@compartido/hooks/useAdminHook';

const UserModal = ({ 
  user = null, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading = false,
  readOnly = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    password: '',
    confirmPassword: '',
    address: '',
    department: '',
    position: '',
    hire_date: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEditing = !!user;
  const { useGetRoles } = useAdminHook();
  const { data: roles = [] } = useGetRoles();

  // Cargar datos del usuario al editar
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        status: user.status || 'active',
        password: '',
        confirmPassword: '',
        address: user.address || '',
        department: user.department || '',
        position: user.position || '',
        hire_date: user.hire_date ? user.hire_date.split('T')[0] : '',
        notes: user.notes || ''
      });
    } else if (!user && isOpen) {
      // Reset form for new user
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'user',
        status: 'active',
        password: '',
        confirmPassword: '',
        address: '',
        department: '',
        position: '',
        hire_date: '',
        notes: ''
      });
    }
    setErrors({});
  }, [user, isOpen]);

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma la contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else if (formData.password) {
      // Si está editando y se proporciona contraseña, validarla
      if (formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generar contraseña aleatoria
  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) { onClose(); return; }
    
    if (!validateForm()) {
      return;
    }

    const submitData = { ...formData };
    
    // Si está editando y no se cambió la contraseña, no la incluir
    if (isEditing && !formData.password) {
      delete submitData.password;
      delete submitData.confirmPassword;
    }

    try {
      if (isEditing) {
        await onSave({ userId: user.id, userData: submitData });
      } else {
        await onSave(submitData);
      }
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Error al guardar el usuario' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Error general */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{errors.submit}</span>
              </div>
            )}

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Juan Pérez"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="juan.perez@empresa.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Contraseña (solo para crear o cambiar) */}
            {(!isEditing || formData.password) && !readOnly && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña {!isEditing && '*'}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña {!isEditing && '*'}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            {/* Botón generar contraseña */}
            {!isEditing && !readOnly && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-sm text-purple-600 hover:text-purple-700"
                     disabled={isLoading || readOnly}
                >
                  Generar contraseña aleatoria
                </button>
              </div>
            )}

            {/* Información de contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+54 11 1234-5678"
                    disabled={isLoading || readOnly}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Calle Falsa 123, Ciudad"
                    disabled={isLoading || readOnly}
                  />
                </div>
              </div>
            </div>

            {/* Información profesional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                  <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Ventas, IT, RRHH"
                    disabled={isLoading || readOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo
                </label>
                  <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Analista, Gerente, Desarrollador"
                    disabled={isLoading || readOnly}
                />
              </div>
            </div>

            {/* Rol y estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol del sistema
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    disabled={isLoading || readOnly}
                  >
                    {roles.length > 0
                      ? roles.map(r => (
                          <option key={r.id} value={r.key || r.name}>
                            {r.name}
                          </option>
                        ))
                      : (
                        <>
                          <option value="viewer">Visualizador</option>
                          <option value="user">Usuario</option>
                          <option value="manager">Gerente</option>
                          <option value="admin">Administrador</option>
                        </>
                      )
                    }
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                 <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                   disabled={isLoading || readOnly}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>
            </div>

            {/* Fecha de contratación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de contratación
              </label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleInputChange('hire_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                disabled={isLoading || readOnly}
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="Información adicional sobre el usuario..."
                disabled={isLoading || readOnly}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={() => handleInputChange('password', 'change')}
                className="text-sm text-purple-600 hover:text-purple-700"
                disabled={isLoading}
              >
                {formData.password ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>

            {!readOnly && (
            <button
              type="submit"
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Guardar cambios' : 'Crear usuario'}
                </>
              )}
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
