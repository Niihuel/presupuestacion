/**
 * Componente AdminDashboard
 * 
 * Dashboard principal del panel de administración con métricas y estadísticas
 */

import { useState } from 'react';
import { 
  Users, 
  Activity, 
  Database, 
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  BarChart3,
  PieChart,
  DollarSign,
  FileText,
  Download,
  Calendar,
  Target
} from 'lucide-react';

import useAdminHook from '@compartido/hooks/useAdminHook';
import { useNotifications } from '@compartido/hooks/useNotifications';
import UserModal from './UserModal';

const AdminDashboard = ({ timePeriod = '30d' }) => {
  const [selectedMetric, setSelectedMetric] = useState('users');
  
  const { 
    useGetAdminDashboard, 
    useGetSystemStats,
    useClearSystemCache,
    useOptimizeDatabase,
    useExportAuditLogs,
    useCreateUser
  } = useAdminHook();
  const notify = useNotifications();

  // Cargar datos
  const { data: dashboardData, isLoading: dashboardLoading } = useGetAdminDashboard(timePeriod);
  const { data: systemStats, isLoading: statsLoading } = useGetSystemStats(timePeriod);

  // Métricas principales
  const MainMetrics = () => {
    if (dashboardLoading || !dashboardData) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    const metrics = [
      {
        title: 'Total Usuarios',
        value: dashboardData.users?.total || 0,
        change: dashboardData.users?.change || 0,
        trend: dashboardData.users?.trend || 'stable',
        icon: Users,
        color: 'bg-blue-500',
        detail: `${dashboardData.users?.active || 0} activos`
      },
      {
        title: 'Sesiones Activas',
        value: dashboardData.sessions?.active || 0,
        change: dashboardData.sessions?.change || 0,
        trend: dashboardData.sessions?.trend || 'stable',
        icon: Activity,
        color: 'bg-green-500',
        detail: `${dashboardData.sessions?.peak || 0} pico diario`
      },
      {
        title: 'Eventos de Auditoría',
        value: dashboardData.audit?.total_events || 0,
        change: dashboardData.audit?.change || 0,
        trend: dashboardData.audit?.trend || 'stable',
        icon: Shield,
        color: 'bg-purple-500',
        detail: `${dashboardData.audit?.critical || 0} críticos`
      },
      {
        title: 'Uso de Base de Datos',
        value: `${dashboardData.database?.usage_percentage || 0}%`,
        change: dashboardData.database?.change || 0,
        trend: dashboardData.database?.trend || 'stable',
        icon: Database,
        color: 'bg-orange-500',
        detail: `${dashboardData.database?.size_gb || 0} GB utilizados`
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                
                {metric.change !== 0 && (
                  <div className={`flex items-center mt-2 text-sm ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    ) : null}
                    {Math.abs(metric.change)}% vs período anterior
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">{metric.detail}</p>
              </div>
              
              <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center ml-4`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Gráfico de actividad de usuarios
  const UserActivityChart = () => {
    // Enriquecido: si falta fecha válida, mostrar etiqueta diseñada
    const activityData = (dashboardData?.user_activity || []).map(d => ({
      ...d,
      date: d.date && d.date !== 'unknown' ? d.date : new Date().toISOString().slice(0,10)
    }));

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Actividad de Usuarios
          </h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {activityData.slice(0, 7).map((day, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {day.date}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(day.active_users / day.total_users) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-16 text-right">
                  {day.active_users}/{day.total_users}
                </span>
              </div>
            </div>
          ))}
        </div>

        {activityData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay datos de actividad disponibles</p>
          </div>
        )}
      </div>
    );
  };

  // Distribución de roles
  const RoleDistribution = () => {
    const rolesData = dashboardData?.roles_distribution || [];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Distribución de Roles
          </h3>
          <PieChart className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {rolesData.map((role, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {role.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">
                  {role.count}
                </span>
                <span className="text-xs text-gray-500">
                  ({role.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {rolesData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay datos de roles disponibles</p>
          </div>
        )}
      </div>
    );
  };

  // Eventos críticos recientes
  const CriticalEvents = () => {
    const events = dashboardData?.critical_events || [];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Eventos Críticos Recientes
          </h3>
          <AlertTriangle className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {events.slice(0, 5).map((event, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                event.level === 'critical' ? 'bg-red-500' :
                event.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {event.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {event.description}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {event.timestamp}
                  <span className="mx-2">•</span>
                  <span>{event.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
            <p className="font-medium text-green-600">Sin eventos críticos</p>
            <p className="text-sm">El sistema está funcionando normalmente</p>
          </div>
        )}
      </div>
    );
  };

  // Estadísticas del sistema
  const SystemOverview = () => {
    if (statsLoading || !systemStats) {
      return (
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    const stats = [
      {
        label: 'Tiempo de actividad',
        value: systemStats.uptime || '0d 0h 0m',
        icon: Server,
        status: 'good'
      },
      {
        label: 'Uso de CPU',
        value: `${systemStats.cpu_usage ?? 0}%`,
        icon: Activity,
        status: (systemStats.cpu_usage ?? 0) > 80 ? 'warning' : 'good'
      },
      {
        label: 'Uso de memoria',
        value: `${systemStats.memory_usage ?? 0}%`,
        icon: Database,
        status: (systemStats.memory_usage ?? 0) > 85 ? 'warning' : 'good'
      },
      {
        label: 'Uso de disco',
        value: `${systemStats.disk_usage ?? 0}%`,
        icon: Target,
        status: (systemStats.disk_usage ?? 0) > 90 ? 'critical' : 'good'
      }
    ];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Estado del Sistema
          </h3>
          <Server className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="p-3 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4 text-gray-600" />
                <div className={`w-2 h-2 rounded-full ${
                  stat.status === 'good' ? 'bg-green-500' :
                  stat.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
              <p className="text-xs text-gray-600">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Mutations para acciones rápidas
  const clearCache = useClearSystemCache();
  const optimizeDb = useOptimizeDatabase();
  const exportLogs = useExportAuditLogs();
  const createUserMutation = useCreateUser();
  const [showCreateUser, setShowCreateUser] = useState(false);

  // Acciones rápidas
  const QuickActions = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Acciones Rápidas
      </h3>
      
      <div className="space-y-3">
        <button
          className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => setShowCreateUser(true)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Crear Usuario</p>
              <p className="text-sm text-gray-600">Agregar nuevo usuario al sistema</p>
            </div>
          </div>
        </button>

        <button
          className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
          onClick={async () => {
            try {
              await clearCache.mutateAsync();
              notify.success('Caché limpiada correctamente');
            } catch (e) {
              notify.warning('Acción pendiente en backend', 'Limpiar caché');
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Limpiar caché</p>
              <p className="text-sm text-gray-600">Invalidar caché de servidor</p>
            </div>
          </div>
        </button>

        <button
          className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
          onClick={async () => {
            try {
              await optimizeDb.mutateAsync();
              notify.success('Optimización de base de datos iniciada');
            } catch (e) {
              notify.warning('Acción pendiente en backend', 'Optimizar BD');
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Optimizar BD</p>
              <p className="text-sm text-gray-600">Mantenimiento y compactación</p>
            </div>
          </div>
        </button>

        <button
          className="w-full flex items-center justify-between p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
          onClick={async () => {
            try {
              await exportLogs.mutateAsync({ filters: {}, format: 'csv' });
              notify.success('Exportación iniciada');
            } catch (e) {
              notify.warning('Acción pendiente en backend', 'Exportar logs');
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Exportar logs</p>
              <p className="text-sm text-gray-600">Descargar auditoría del sistema</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <MainMetrics />

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserActivityChart />
        <RoleDistribution />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CriticalEvents />
        </div>
        <div className="space-y-6">
          <SystemOverview />
          <QuickActions />
        </div>
      </div>

      {showCreateUser && (
        <UserModal
          user={null}
          isOpen={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          onSave={async (payload) => {
            try {
              await createUserMutation.mutateAsync(payload);
              notify.success('Usuario creado correctamente');
              setShowCreateUser(false);
            } catch (e) {
              notify.error('No se pudo crear el usuario');
            }
          }}
          isLoading={createUserMutation.isPending}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
