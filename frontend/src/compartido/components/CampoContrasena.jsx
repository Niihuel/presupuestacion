import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const CampoContrasena = ({ 
  id, 
  register, 
  error, 
  label = "Contraseña", 
  showStrength = false,
  value = "",
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    const strengthLevels = {
      0: { text: '', color: '', width: '0%' },
      1: { text: 'Muy débil', color: 'bg-red-500', width: '20%' },
      2: { text: 'Débil', color: 'bg-orange-500', width: '40%' },
      3: { text: 'Regular', color: 'bg-yellow-500', width: '60%' },
      4: { text: 'Fuerte', color: 'bg-blue-500', width: '80%' },
      5: { text: 'Muy fuerte', color: 'bg-green-500', width: '100%' }
    };
    
    return strengthLevels[score];
  };

  const strength = showStrength ? getPasswordStrength(value) : null;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          {...register}
          className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      
      {showStrength && value && (
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Fortaleza de la contraseña:</span>
            <span className={`text-xs font-medium ${
              strength.color === 'bg-red-500' ? 'text-red-600' :
              strength.color === 'bg-orange-500' ? 'text-orange-600' :
              strength.color === 'bg-yellow-500' ? 'text-yellow-600' :
              strength.color === 'bg-blue-500' ? 'text-blue-600' :
              strength.color === 'bg-green-500' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {strength.text}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: strength.width }}
            ></div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            <p>La contraseña debe contener:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li className={value.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                Al menos 8 caracteres
              </li>
              <li className={/[a-z]/.test(value) ? 'text-green-600' : 'text-gray-500'}>
                Una letra minúscula
              </li>
              <li className={/[A-Z]/.test(value) ? 'text-green-600' : 'text-gray-500'}>
                Una letra mayúscula
              </li>
              <li className={/\d/.test(value) ? 'text-green-600' : 'text-gray-500'}>
                Un número
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(value) ? 'text-green-600' : 'text-gray-500'}>
                Un carácter especial
              </li>
            </ul>
          </div>
        </div>
      )}
      
      {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}
    </div>
  );
};

export default CampoContrasena;