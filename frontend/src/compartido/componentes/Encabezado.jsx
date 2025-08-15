/**
 * Componente Header de la aplicación
 * 
 * Muestra la información del usuario y opciones de navegación principales
 */

import { LogOut } from 'lucide-react';
import { useAuthStore } from '@nucleo/store/auth.store';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      notifications.error('Error al cerrar sesión');
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Bienvenido, {user?.nombre || 'Usuario'}</h2>
      </div>
      <div className="flex items-center space-x-4">
        {/* Botón de logout */}
        <button
          onClick={handleLogout}
          className="flex items-center text-gray-600 hover:text-red-500 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;