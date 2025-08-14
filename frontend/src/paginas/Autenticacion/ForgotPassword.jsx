import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { authService } from '@compartido/services';
import { useNotifications } from '@compartido/hooks/useNotifications';
import LoadingState from '@compartido/components/LoadingState';
import paschiniIcon from '@recursos/images/paschini-icon.png';
import pretensaIcon from '@recursos/images/pretensa-icon.png';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await authService.forgotPassword(data.email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRecovery = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pretensa-gradient">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {/* Company Icons */}
        <div className="flex justify-center space-x-6 mb-6">
          <img src={paschiniIcon} alt="Paschini" className="h-16 w-16 object-contain" />
          <img src={pretensaIcon} alt="Pretensa" className="h-16 w-16 object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800">Recuperar Contraseña</h2>
        {error && <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
        {success && <p className="text-center text-sm text-green-600 bg-green-100 p-2 rounded-md">Si el correo está registrado, recibirás un enlace de recuperación.</p>}
        <p className="text-center text-sm text-gray-600">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              {...register('email', { required: 'El correo es requerido' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </button>
          </div>
        </form>

        {/* Google Recovery Option */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O si te registraste con</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleRecovery}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Acceder con Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;