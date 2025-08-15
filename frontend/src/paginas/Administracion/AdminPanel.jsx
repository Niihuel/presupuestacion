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
import PreciosPiezas from './PreciosPiezas.jsx';
import EditorBOM from './EditorBOM.jsx';
import GestionUsuarios from './GestionUsuarios.jsx';
import GestionRoles from './GestionRoles.jsx';
import ConfiguracionSistema from './ConfiguracionSistema.jsx';
import Comparativos from './Comparativos.jsx';

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
      case 'camiones':
      case 'transporte':
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
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow p-2 flex items-center gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>{CurrentTab}</div>
    </div>
  );
};

export default AdminPanel;
