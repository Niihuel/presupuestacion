/**
 * Header de Navegación Principal
 * 
 * Barra de navegación superior con:
 * - Logo y título del sistema
 * - Menú de navegación horizontal
 * - Información del usuario y logout
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  FolderKanban, 
  Puzzle, 
  Package,
  Settings, 
  Shield, 
  Key,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MapPin,
  Calculator
} from 'lucide-react';
import { useAuthStore } from '@nucleo/store/auth.store';
import { authService } from '@compartido/servicios';
// Importar las imágenes
import pretensaIcon from '@recursos/images/pretensa-icon.png';
import paschiniIcon from '@recursos/images/paschini-icon.png';

const EncabezadoNavegacion = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  // Navegación principal (siempre visible)
  const mainNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/proyectos', label: 'Obras', icon: FolderKanban },
    { to: '/piezas', label: 'Piezas', icon: Puzzle },
    { to: '/materiales', label: 'Materiales', icon: Package },
    { to: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  // Dropdown de Plantas/Ubicaciones
  const locationLinks = [
    { to: '/zonas', label: 'Zonas/Plantas', icon: MapPin },
    { to: '/calculistas', label: 'Calculistas', icon: Calculator },
  ];

  // Dropdown de administración (solo para admins)
  const adminLinks = [
    { to: '/admin?tab=dashboard', label: 'Panel Principal', icon: Shield },
    { to: '/admin?tab=users', label: 'Usuarios', icon: Users },
    { to: '/admin?tab=roles', label: 'Roles', icon: Key },
  ];

  const handleLogout = async () => {
    try {
      // Cerrar el menú de usuario
      setUserMenuOpen(false);
      
      // Llamar al servicio de logout del backend
      await authService.logout();
      
      // Limpiar el estado local
      logout();
      
      // Navegar al login
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aunque falle el logout en el servidor, limpiar localmente
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src={pretensaIcon} 
                alt="Pretensa" 
                className="h-10 w-10 object-contain"
              />
              <img 
                src={paschiniIcon} 
                alt="Paschini" 
                className="h-10 w-10 object-contain"
              />
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {/* Enlaces principales */}
            {mainNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <link.icon className="h-4 w-4 mr-2" />
                {link.label}
              </NavLink>
            ))}

            {/* Dropdown de Plantas/Ubicaciones */}
            <div className="relative">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Plantas
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    {locationLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setLocationDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-2 text-sm transition-colors ${
                            isActive 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <link.icon className="h-4 w-4 mr-2" />
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown de Administración (solo para admins) */}
            {user && (user.role === 'admin' || user.role === 'superadmin') && (
              <div className="relative">
                <button
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>

                {adminDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      {adminLinks.map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={() => setAdminDropdownOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-4 py-2 text-sm transition-colors ${
                              isActive 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                          }
                        >
                          <link.icon className="h-4 w-4 mr-2" />
                          {link.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Usuario y acciones */}
          <div className="flex items-center space-x-4">
            {/* Usuario dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md px-3 py-2"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                </div>
                <span className="hidden sm:block max-w-32 truncate">
                  {user?.first_name || user?.username || 'Usuario'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1" onClick={(e) => e.stopPropagation()}>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.first_name || user?.username || 'Usuario'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    
                    {/* Change password for non-OAuth users */}
                    {user && !user.oauth_provider && (
                      <NavLink
                        to="/auth/change-password"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserMenuOpen(false);
                        }}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Cambiar Contraseña
                      </NavLink>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-2">
            <nav className="space-y-1">
              {/* Enlaces principales móvil */}
              {mainNavLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`
                  }
                >
                  <link.icon className="h-5 w-5 mr-3" />
                  {link.label}
                </NavLink>
              ))}

              {/* Sección de Plantas en móvil */}
              <div className="pt-2 border-t border-gray-200">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Plantas
                </div>
                {locationLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-6 py-2 rounded-md text-base font-medium ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <link.icon className="h-5 w-5 mr-3" />
                    {link.label}
                  </NavLink>
                ))}
              </div>

              {/* Sección de Administración en móvil (solo para admins) */}
              {user && (user.role === 'admin' || user.role === 'superadmin') && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administración
                  </div>
                  {adminLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-6 py-2 rounded-md text-base font-medium ${
                          isActive 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`
                      }
                    >
                      <link.icon className="h-5 w-5 mr-3" />
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Overlays para cerrar dropdowns */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-[35]" 
          onClick={() => setUserMenuOpen(false)}
        />
      )}
      {locationDropdownOpen && (
        <div 
          className="fixed inset-0 z-[35]" 
          onClick={() => setLocationDropdownOpen(false)}
        />
      )}
      {adminDropdownOpen && (
        <div 
          className="fixed inset-0 z-[35]" 
          onClick={() => setAdminDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default EncabezadoNavegacion;
