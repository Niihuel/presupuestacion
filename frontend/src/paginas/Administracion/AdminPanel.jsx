/**
 * Panel Principal de Administración
 * 
 * Tabs: Dashboard | Usuarios | Roles | Configuración
 * Usa query param ?tab= para navegación directa.
 */

import { useMemo } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Settings, Package, Cog, ListTree, Percent, Truck, DollarSign, BarChart3 } from 'lucide-react';
import PreciosMateriales from './PreciosMateriales.jsx';
import ParametrosProceso from './ParametrosProceso.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import { AdminShell } from '@compartido/componentes/AdminUI';
import PreciosPiezas from './PreciosPiezas.jsx';
import EditorBOM from './EditorBOM.jsx';
import GestionUsuarios from './GestionUsuarios.jsx';
import GestionRoles from './GestionRoles.jsx';
import ConfiguracionSistema from './ConfiguracionSistema.jsx';
import Comparativos from './Comparativos.jsx';
import AdminPolicies from './AdminPolicies.jsx';
import AdminTrucks from './AdminTrucks.jsx';
import AdminTransportMounting from './AdminTransportMounting.jsx';

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
        return <GestionUsuarios />;
      case 'roles':
        return <GestionRoles />;
      case 'config':
        return <ConfiguracionSistema />;
      case 'insumos':
        return <PreciosMateriales />;
      case 'parametros':
        return <ParametrosProceso />;
      case 'bom':
        return <EditorBOM />;
      case 'politicas':
        return <AdminPolicies />;
      case 'camiones':
        return <AdminTrucks />;
      case 'transporte':
        return <AdminTransportMounting />;
      case 'precios':
        return <PreciosPiezas />;
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
