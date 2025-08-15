/**
 * Panel Principal de Administración
 * 
 * Tabs: Dashboard | Usuarios | Roles | Configuración
 * Usa query param ?tab= para navegación directa.
 */

import { useMemo } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Settings, Package, Cog, ListTree, Percent, Truck, DollarSign, BarChart3 } from 'lucide-react';
import MaterialsPrices from './MaterialsPrices';
import ProcessParams from './ProcessParams';
import AdminDashboard from './AdminDashboard';
import { AdminShell } from '@compartido/componentes/AdminUI';
import PiecePrices from './PiecePrices';
import BOMEditor from './BOMEditor';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import SystemConfig from './SystemConfig';
import Comparativos from './Comparativos';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'config', label: 'Configuración', icon: Settings },
  // Nuevos módulos de administración (placeholders – pantallas a crear)
  { id: 'insumos', label: 'Insumos', icon: Package },
  { id: 'parametros', label: 'Parámetros', icon: Cog },
  { id: 'bom', label: 'BOM', icon: ListTree },
  { id: 'politicas', label: 'Políticas', icon: Percent },
  { id: 'camiones', label: 'Camiones', icon: Truck },
  { id: 'transporte', label: 'Transp. & Montaje', icon: DollarSign },
  { id: 'precios', label: 'Precios Piezas', icon: DollarSign },
  { id: 'comparativos', label: 'Comparativos', icon: BarChart3 },
];

const AdminPanel = () => {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'dashboard';

  const setTab = (tab) => {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    setParams(next, { replace: true });
  };

  const CurrentTab = useMemo(() => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'config':
        return <SystemConfig />;
      case 'insumos':
        return <MaterialsPrices />;
      case 'parametros':
        return <ProcessParams />;
      case 'bom':
        return <BOMEditor />;
      case 'politicas':
        return <(await import('./AdminPolicies.jsx')).default />;
      case 'camiones':
        return <(await import('./AdminTrucks.jsx')).default />;
      case 'transporte':
        return <(await import('./AdminTransportMounting.jsx')).default />;
      case 'precios':
        return <PiecePrices />;
      case 'comparativos':
        return <Comparativos />;
      case 'dashboard':
      default:
        return <AdminDashboard />;
    }
  }, [activeTab]);

  return (
    <AdminShell
      title="Administración"
      subtitle="Gestione catálogos, parámetros y políticas del sistema"
      actions={null}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-pressed={activeTab === id}
              aria-label={`Tab ${label}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">{CurrentTab}</div>
    </AdminShell>
  );
};

export default AdminPanel;
