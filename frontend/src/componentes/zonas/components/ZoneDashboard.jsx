/**
 * Componente ZoneDashboard
 * 
 * Dashboard completo con métricas, gráficos y análisis de zonas

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  DollarSign,
  Package,
  Users,
  Calendar,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useZoneMetrics, useZonesStats } from '@compartido/hooks/useZonesHook';

const ZoneDashboard = ({ selectedZoneId = null, onZoneSelect, className = '' }) => {
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [metricType, setMetricType] = useState('all'); // 'pricing', 'activity', 'performance'
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar datos
  const { data: zonesStats, isLoading: statsLoading } = useZonesStats();
  const { data: selectedZoneMetrics, isLoading: metricsLoading } = useZoneMetrics(
    selectedZoneId, 
    { enabled: !!selectedZoneId }
  );

  // Función para refrescar datos
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Métricas generales del sistema
  const GeneralMetrics = () => {
    if (statsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    const metrics = [
      {
        title: 'Total Zonas',
        value: zonesStats?.total_zones || 0,
        icon: MapPin,
        color: 'bg-blue-500',
        change: zonesStats?.zones_change || 0,
      },
      {
        title: 'Zonas Activas',
        value: zonesStats?.active_zones || 0,
        icon: CheckCircle,
        color: 'bg-green-500',
        change: zonesStats?.active_change || 0,
      },
      {
        title: 'Precios Gestionados',
        value: zonesStats?.total_prices || 0,
        icon: DollarSign,
        color: 'bg-purple-500',
        change: zonesStats?.prices_change || 0,
      },
      {
        title: 'Valor Promedio',
        value: `$${(zonesStats?.average_price || 0).toLocaleString()}`,
        icon: TrendingUp,
        color: 'bg-orange-500',
        change: zonesStats?.avg_price_change || 0,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                {metric.change !== 0 && (
                  <div className={`flex items-center mt-2 text-sm ${
                    metric.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change > 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(metric.change)}% vs mes anterior
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Gráfico de distribución de zonas por estado
  const ZoneStatusChart = () => {
    const statusData = [
      { name: 'Activas', value: zonesStats?.active_zones || 0, color: 'bg-green-500' },
      { name: 'Inactivas', value: zonesStats?.inactive_zones || 0, color: 'bg-gray-500' },
      { name: 'Mantenimiento', value: zonesStats?.maintenance_zones || 0, color: 'bg-yellow-500' },
    ];

    const total = statusData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Distribución por Estado
          </h3>
          <PieChart className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {statusData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 ${item.color} rounded mr-3`}></div>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">{item.value}</span>
                <span className="text-xs text-gray-500">
                  ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de progreso visual */}
        <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="flex h-full">
            {statusData.map((item, index) => (
              <div
                key={index}
                className={item.color}
                style={{ 
                  width: total > 0 ? `${(item.value / total) * 100}%` : '0%' 
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Ranking de zonas por rendimiento
  const ZoneRanking = () => {
    const topZones = zonesStats?.top_zones || [];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Top Zonas por Precios
          </h3>
          <Target className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {topZones.slice(0, 5).map((zone, index) => (
            <div 
              key={zone.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onZoneSelect?.(zone)}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{zone.name}</p>
                  <p className="text-sm text-gray-500">{zone.code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {zone.total_prices} precios
                </p>
                <p className="text-sm text-gray-500">
                  ${(zone.avg_price || 0).toLocaleString()} promedio
                </p>
              </div>
            </div>
          ))}
        </div>

        {topZones.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay datos de zonas disponibles</p>
          </div>
        )}
      </div>
    );
  };

  // Actividad reciente
  const RecentActivity = () => {
    const activities = zonesStats?.recent_activities || [];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Actividad Reciente
          </h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {activities.slice(0, 6).map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'create' ? 'bg-green-500' :
                activity.type === 'update' ? 'bg-blue-500' :
                activity.type === 'delete' ? 'bg-red-500' : 'bg-gray-500'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.zone_name} • {activity.created_at}
                </p>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay actividad reciente</p>
          </div>
        )}
      </div>
    );
  };

  // Métricas detalladas de zona seleccionada
  const SelectedZoneDetails = () => {
    if (!selectedZoneId || metricsLoading) return null;

    const metrics = selectedZoneMetrics || {};

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalles de Zona: {metrics.zone_name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              metrics.status === 'active' ? 'bg-green-100 text-green-800' :
              metrics.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {metrics.status === 'active' ? 'Activa' :
               metrics.status === 'inactive' ? 'Inactiva' : 'Mantenimiento'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{metrics.total_pieces || 0}</p>
            <p className="text-sm text-blue-600">Piezas con precio</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">
              ${(metrics.avg_price || 0).toLocaleString()}
            </p>
            <p className="text-sm text-green-600">Precio promedio</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">
              {metrics.price_variation || 0}%
            </p>
            <p className="text-sm text-purple-600">Variación mensual</p>
          </div>
        </div>

        {metrics.last_update && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Última actualización: {new Date(metrics.last_update).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  };

  // Controles del dashboard
  const DashboardControls = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
              className="text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todas las métricas</option>
              <option value="pricing">Solo precios</option>
              <option value="activity">Solo actividad</option>
              <option value="performance">Solo rendimiento</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controles */}
      <DashboardControls />

      {/* Métricas de zona seleccionada */}
      <SelectedZoneDetails />

      {/* Métricas generales */}
      <GeneralMetrics />

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ZoneStatusChart />
        <ZoneRanking />
      </div>

      {/* Actividad reciente */}
      <RecentActivity />

      {/* Alertas y notificaciones */}
      {zonesStats?.alerts && zonesStats.alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="text-sm font-medium text-yellow-800">
              Alertas del sistema
            </h4>
          </div>
          <div className="mt-2 space-y-1">
            {zonesStats.alerts.map((alert, index) => (
              <p key={index} className="text-sm text-yellow-700">
                • {alert.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneDashboard;
