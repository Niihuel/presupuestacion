/**
 * Página para cambio de contraseña
 * 
 * Permite a los usuarios cambiar su contraseña actual
 */

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuthStore } from '@nucleo/store/auth.store';
import { authService } from '@compartido/servicios';
import { CampoContrasena } from '@compartido/componentes';
import { useNotifications } from '@compartido/hooks/useNotificaciones';

const ChangePasswordPage = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const notifications = useNotifications();
  
  const newPassword = watch('newPassword', '');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      notifications.success('Contraseña cambiada exitosamente');
      // Reiniciar formulario
      document.getElementById('change-password-form').reset();
    } catch (err) {
      notifications.error(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sesión Requerida</h2>
          <p className="text-gray-600">Debes iniciar sesión para cambiar tu contraseña.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Cambiar Contraseña</h1>
          <p className="mt-1 text-sm text-gray-600">
            Actualiza tu contraseña para mantener tu cuenta segura
          </p>
        </div>
        
        <div className="px-6 py-6">
          <form id="change-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <CampoContrasena
              id="currentPassword"
              register={register('currentPassword', {
                required: 'La contraseña actual es requerida'
              })}
              error={errors.currentPassword}
              label="Contraseña Actual"
              placeholder="Ingresa tu contraseña actual"
            />
            
            <CampoContrasena
              id="newPassword"
              register={register('newPassword', {
                required: 'La nueva contraseña es requerida',
                minLength: {
                  value: 8,
                  message: 'La contraseña debe tener al menos 8 caracteres'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número'
                }
              })}
              error={errors.newPassword}
              label="Nueva Contraseña"
              placeholder="Ingresa tu nueva contraseña"
              showStrength={true}
              value={newPassword}
            />
            
            <CampoContrasena
              id="confirmNewPassword"
              register={register('confirmNewPassword', {
                required: 'Confirma tu nueva contraseña',
                validate: value => value === newPassword || 'Las contraseñas no coinciden'
              })}
              error={errors.confirmNewPassword}
              label="Confirmar Nueva Contraseña"
              placeholder="Confirma tu nueva contraseña"
            />
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
