/**
 * Página Principal del Panel de Administración
 * 
 * Centro de control administrativo con:
 * - Dashboard con métricas del sistema
 * - Gestión de usuarios y roles
 * - Logs de auditoría
 * - Configuración del sistema
 * - Monitoreo y estadísticas
 */

import { useState, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Bell,
  Download,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Eye,
  TrendingUp,
  TrendingDown,
  Server,
  Lock,
  UserCheck,
  FileSearch
} from 'lucide-react';

// Hooks
import { useAdminHook } from '@shared/hooks/useAdminHook';

// Componentes
import AdminDashboard from '../features/admin/components/AdminDashboard';
import UserManagement from '../features/admin/components/UserManagement';
import RoleManagement from '../features/admin/components/RoleManagement';
import AuditLogs from '../features/admin/components/AuditLogs';
import SystemConfig from '../features/admin/components/SystemConfig';
import SystemMonitoring from '../features/admin/components/SystemMonitoring';
import ReportsPanel from '../features/admin/components/ReportsPanel';

const AdminPanel = () => {
  // Estados locales
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timePeriod, setTimePeriod] = useState('30d');

  // Cargar datos del panel
  const { 
    useGetAdminDashboard,
    useGetSystemHealth,
    useGetUsers,
    useGetAuditLogs
  } = useAdminHook();
  
  const { data: dashboard, isLoading: dashboardLoading } = useGetAdminDashboard(timePeriod);
  const { data: systemHealth, isLoading: healthLoading } = useGetSystemHealth();
  const { data: usersStats, isLoading: usersLoading } = useGetUsers({ limit: 1 });
  const { data: auditStats, isLoading: auditLoading } = useGetAuditLogs({ limit: 1 });
  
  const isLoading = dashboardLoading || healthLoading || usersLoading || auditLoading;

  // Configuración de tabs
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      component: AdminDashboard,
      description: 'Vista general del sistema'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      component: UserManagement,
      description: 'Gestión de usuarios del sistema',
      badge: usersStats?.total_users || 0
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: Shield,
      component: RoleManagement,
      description: 'Gestión de roles y permisos'
    },
    {
      id: 'audit',
      label: 'Auditoría',
      icon: FileSearch,
      component: AuditLogs,
      description: 'Logs de auditoría del sistema',
      badge: auditStats?.today_events || 0
    },
    {
      id: 'config',
      label: 'Configuración',
      icon: Settings,
      component: SystemConfig,
      description: 'Configuración del sistema'
    },
    {
      id: 'monitoring',
      label: 'Monitoreo',
      icon: Activity,
      component: SystemMonitoring,
      description: 'Estado y rendimiento del sistema',
      status: systemHealth?.status || 'unknown'
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: FileText,
      component: ReportsPanel,
      description: 'Reportes y estadísticas'
    }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const CurrentComponent = currentTab?.component;

  // Estadísticas rápidas del header
  const QuickStats = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    const stats = [
      {
        title: 'Usuarios Activos',
        value: usersStats?.active_users || 0,
        icon: UserCheck,
        color: 'bg-green-500',
        change: usersStats?.users_change || 0,
        trend: usersStats?.users_trend || 'stable'
      },
      {
        title: 'Eventos de Auditoría',
        value: auditStats?.today_events || 0,
        icon: Activity,
        color: 'bg-blue-500',
        change: auditStats?.events_change || 0,
        trend: auditStats?.events_trend || 'stable'
      },
      {
        title: 'Estado del Sistema',
        value: systemHealth?.status === 'healthy' ? 'Saludable' : 'Revisión',
        icon: Server,
        color: systemHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500',
        subtext: `CPU: ${systemHealth?.cpu_usage || 0}%`
      },
      {
        title: 'Tiempo de Actividad',
        value: systemHealth?.uptime || '0d 0h',
        icon: Clock,
        color: 'bg-purple-500',
        subtext: 'Desde último reinicio'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                {stat.change !== undefined && (
                  <div className={`flex items-center mt-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {stat.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(stat.change)}% vs ayer
                  </div>
                )}
                {stat.subtext && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                )}
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Alertas del sistema
  const SystemAlerts = () => {
    const alerts = systemHealth?.alerts || [];
    
    if (alerts.length === 0) return null;

    return (
      <div className="mb-6">
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border-l-4 mb-2 ${
              alert.level === 'critical' ? 'bg-red-50 border-red-500' :
              alert.level === 'warning' ? 'bg-yellow-50 border-yellow-500' :
              'bg-blue-50 border-blue-500'
            }`}
          >
            <div className="flex items-center">
              <AlertTriangle className={`w-5 h-5 mr-2 ${
                alert.level === 'critical' ? 'text-red-600' :
                alert.level === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div>
                <p className={`font-medium ${
                  alert.level === 'critical' ? 'text-red-800' :
                  alert.level === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {alert.title}
                </p>
                <p className={`text-sm ${
                  alert.level === 'critical' ? 'text-red-700' :
                  alert.level === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Navegación de tabs
  const TabNavigation = () => (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {tab.badge}
                </span>
              )}
              {tab.status && (
                <div className={`w-2 h-2 rounded-full ml-2 ${
                  tab.status === 'healthy' ? 'bg-green-500' :
                  tab.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Descripción del tab activo */}
      <div className="px-6 py-3 bg-gray-50">
        <p className="text-sm text-gray-600">{currentTab?.description}</p>
      </div>
    </div>
  );

  // Controles del header
  const HeaderControls = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600">
          Gestión completa del sistema y usuarios
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Selector de período */}
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
        >
          <option value="24h">Últimas 24h</option>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
        </select>

        {/* Botón de actualizar */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </button>

        {/* Accesos rápidos */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('users')}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </button>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Error de Acceso
          </h3>
          <p className="text-gray-600 text-center mb-4">
            No se pudo cargar el panel de administración. Verifica tus permisos.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con controles */}
        <HeaderControls />

        {/* Alertas del sistema */}
        <SystemAlerts />

        {/* Estadísticas rápidas */}
        <QuickStats />

        {/* Navegación de tabs */}
        <TabNavigation />

        {/* Contenido del tab activo */}
        <div className="min-h-96">
          {CurrentComponent ? (
            <CurrentComponent 
              timePeriod={timePeriod}
              dashboardData={dashboard}
              systemHealth={systemHealth}
              isLoading={isLoading}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sección en Desarrollo
              </h3>
              <p className="text-gray-600">
                Esta funcionalidad estará disponible próximamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
