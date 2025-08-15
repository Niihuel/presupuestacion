/**
 * Componente de Inicio de Sesión
 * 
 * Maneja la autenticación de usuarios con soporte para:
 * - Login con credenciales usuario/contraseña
 * - Integración con OAuth (Google)
 * - Validación de formularios con React Hook Form
 * - Manejo de estados de error específicos
 * - Notificaciones con Sonner
 */

import { useForm } from 'react-hook-form';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@nucleo/store/auth.store';
import { authService } from '@compartido/servicios';
import { toast } from 'sonner';
import { CampoContrasena } from '@compartido/componentes';
import paschiniIcon from '@recursos/images/paschini-icon.png';
import pretensaIcon from '@recursos/images/pretensa-icon.png';

const LoginPage = () => {
  // Configuración del formulario con React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Verificar si viene de registro con Google para mostrar mensaje de éxito
  useEffect(() => {
    if (searchParams.get('registered') === 'google') {
      toast.success('Te has registrado exitosamente con Google. Ya puedes iniciar sesión.');
    }
  }, [searchParams]);

  // Función para manejar el envío del formulario de login
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      login(res);
      toast.success('Inicio de sesión exitoso');
      navigate('/');
    } catch (err) {
      // Mostrar mensajes específicos de error según el tipo
      if (err.message.includes('pendiente de aprobación')) {
        toast.warning('Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos por email cuando sea activada.', {
          duration: 6000
        });
      } else if (err.message.includes('no ha sido verificada')) {
        toast.warning('Tu cuenta no ha sido verificada. Por favor, verifica tu email.', {
          duration: 5000
        });
      } else {
        toast.error(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el login con Google OAuth
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pretensa-gradient">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {/* Company Icons */}
        <div className="flex justify-center space-x-6 mb-6">
          <img src={paschiniIcon} alt="Paschini" className="h-16 w-16 object-contain" />
          <img src={pretensaIcon} alt="Pretensa" className="h-16 w-16 object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800">Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
            <input
              id="username"
              type="text"
              {...register('username', { required: 'El nombre de usuario es requerido' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ingresa tu nombre de usuario"
            />
            {errors.username && <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>}
          </div>
          <CampoContrasena
            id="password"
            register={register('password', { required: 'La contraseña es requerida' })}
            error={errors.password}
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
          />
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O con Google</span>
          </div>
        </div>

        {/* OAuth Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center py-3 px-4 border-2 border-blue-500 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar sesión con Google
          </button>
        </div>

        <div className="text-center text-sm">
          <p>
            <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p className="mt-2">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Regístrate
            </Link>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Los registros manuales requieren aprobación de administrador
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;