import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authService } from '@shared/services';
import { useNotifications } from '@shared/hooks/useNotifications';
import LoadingState from '@shared/components/LoadingState';
import paschiniIcon from '../../assets/images/paschini-icon.png';
import pretensaIcon from '../../assets/images/pretensa-icon.png';

export default function ResetPasswordPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const password = watch('password');

  const onSubmit = handleSubmit(async (data) => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Token de restablecimiento no encontrado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword({ token, password: data.password });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-pretensa-gradient flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        {/* Company Icons */}
        <div className="flex justify-center space-x-6 mb-6">
          <img src={paschiniIcon} alt="Paschini" className="h-16 w-16 object-contain" />
          <img src={pretensaIcon} alt="Pretensa" className="h-16 w-16 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Restablecer Contraseña</h2>
        
        {success ? (
          <div className="text-center text-green-600">
            <p>¡Tu contraseña ha sido restablecida con éxito!</p>
            <p>Serás redirigido al login en unos segundos...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="password"
                {...register('password', { 
                  required: 'La contraseña es requerida',
                  minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                })}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.password ? 'border-red-500' : ''}`}
              />
              {errors.password && <p className="text-red-500 text-xs italic mt-2">{errors.password.message}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: 'Debes confirmar la contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs italic">{errors.confirmPassword.message}</p>}
            </div>

            {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-blue-300"
              >
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}