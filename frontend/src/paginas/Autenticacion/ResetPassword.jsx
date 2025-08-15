import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
<<<<<<< Current (Your changes)
import { authService } from '@compartido/services';
import { useNotificaciones as useNotifications } from '@compartido/hooks';
import LoadingState from '@compartido/components';
=======
import { authService } from '@compartido/servicios';
import { useNotifications } from '@compartido/hooks/useNotificaciones';
import LoadingState from '@compartido/componentes/EstadoCargando.jsx';
>>>>>>> Incoming (Background Agent changes)
import paschiniIcon from '@recursos/images/paschini-icon.png';
import pretensaIcon from '@recursos/images/pretensa-icon.png';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const newPassword = event.target.password.value;

    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pretensa-gradient">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {/* Company Icons */}
        <div className="flex justify-center space-x-6 mb-6">
          <img src={paschiniIcon} alt="Paschini" className="h-16 w-16 object-contain" />
          <img src={pretensaIcon} alt="Pretensa" className="h-16 w-16 object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800">Restablecer Contraseña</h2>
        {error && <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
        {success && <p className="text-center text-sm text-green-600 bg-green-100 p-2 rounded-md">Contraseña restablecida correctamente. Redirigiendo al login...</p>}
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Restablecer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;