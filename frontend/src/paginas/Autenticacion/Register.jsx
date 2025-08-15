import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useRegister } from '@compartido/hooks/useAuth';
import { CampoContrasena } from '@compartido/componentes';
import paschiniIcon from '@recursos/images/paschini-icon.png';
import pretensaIcon from '@recursos/images/pretensa-icon.png';

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm({
    mode: 'onChange' // Validate on change for better UX
  });
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const password = watch('password', '');
  
  // React Query hook
  const registerMutation = useRegister();

  const onSubmit = (data) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    });
  };

  const handleNext = async () => {
    let fieldsToValidate;
    if (step === 1) {
      fieldsToValidate = ['firstName', 'lastName', 'username'];
    } else if (step === 2) {
      fieldsToValidate = ['email'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pretensa-gradient">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center space-x-6 mb-6">
          <img src={paschiniIcon} alt="Paschini" className="h-16 w-16 object-contain" />
          <img src={pretensaIcon} alt="Pretensa" className="h-16 w-16 object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800">Crear Cuenta</h2>
        
        {registerMutation.error && (
          <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">
            {registerMutation.error.response?.data?.message || 'Error al registrarse'}
          </p>
        )}
        {success && (
          <div className="text-center text-sm text-green-600 bg-green-100 p-3 rounded-md">
            <p className="font-medium">¡Registro exitoso!</p>
            <p className="mt-1">Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos por email cuando sea activada.</p>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input id="firstName" type="text" {...register('firstName', { required: 'El nombre es requerido' })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellido</label>
                  <input id="lastName" type="text" {...register('lastName', { required: 'El apellido es requerido' })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                <input id="username" type="text" {...register('username', { required: 'El nombre de usuario es requerido' })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                {errors.username && <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                <input id="email" type="email" {...register('email', { required: 'El correo es requerido' })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono (opcional)</label>
                <input id="phone" type="tel" {...register('phone')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <CampoContrasena id="password" register={register('password', { required: 'La contraseña es requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} error={errors.password} label="Contraseña" showStrength={true} value={password} placeholder="Ingresa tu contraseña" />
              <CampoContrasena id="confirmPassword" register={register('confirmPassword', { required: 'Confirma tu contraseña', validate: value => value === password || 'Las contraseñas no coinciden' })} error={errors.confirmPassword} label="Confirmar Contraseña" placeholder="Confirma tu contraseña" />
            </>
          )}

          <div className="flex justify-between">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Atrás
              </button>
            )}
            {step < 3 && (
              <button type="button" onClick={handleNext} className="ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Siguiente
              </button>
            )}
            {step === 3 && (
              <button type="submit" disabled={registerMutation.isPending} className="ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {registerMutation.isPending ? 'Registrando...' : 'Registrarse'}
              </button>
            )}
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
            onClick={handleGoogleRegister} 
            className="w-full flex justify-center items-center py-3 px-4 border-2 border-green-500 rounded-md shadow-sm text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Registrarse con Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Inicia sesión
          </Link>
        </p>
        
        <div className="text-center">
          <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            ⚠️ Los registros manuales requieren aprobación de administrador
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;