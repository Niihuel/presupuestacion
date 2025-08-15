import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, FolderKanban, Puzzle, Settings, Shield, Key } from 'lucide-react';
import { useAuthStore } from '@nucleo/store/auth.store';

const Sidebar = () => {
  const { user } = useAuthStore();
  
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/presupuestos', label: 'Presupuestos', icon: FileText },
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
    { to: '/piezas', label: 'Piezas', icon: Puzzle },
    { to: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  // Add admin panel for admins
  if (user && (user.role === 'admin' || user.role === 'superadmin')) {
    navLinks.push({ to: '/admin', label: 'Panel Admin', icon: Shield });
  }

  // Add change password for non-OAuth users
  if (user && !user.oauth_provider) {
    navLinks.push({ to: '/change-password', label: 'Cambiar Contraseña', icon: Key });
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white shadow-md">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">Presupuestador</h1>
      </div>
      <nav className="mt-4">
        <ul>
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 ${isActive ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-500' : ''}`
                }
              >
                <link.icon className="h-5 w-5 mr-3" />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;