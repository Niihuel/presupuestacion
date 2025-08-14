/**
 * Componente SystemMonitoring
 * 
 * Panel de monitoreo del sistema con métricas en tiempo real

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Shield,
  Zap,
  Eye,
  Download
} from 'lucide-react';
import { useAdminHook } from '../../shared/hooks/useAdminHook';

const SystemMonitoring = () => {
  const { 
    useGetSystemHealth,
    useGetSystemMetrics,
    useGetSystemLogs
  } = useAdminHook();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [selectedMetric, setSelectedMetric] = useState('cpu');

  const { 
    data: healthData, 
    isLoading: healthLoading, 
    refetch: refetchHealth 
  } = useGetSystemHealth();

  const { 
    data: metricsData, 
    isLoading: metricsLoading, 
    refetch: refetchMetrics 
  } = useGetSystemMetrics();

  const { 
    data: logsData, 
    isLoading: logsLoading 
  } = useGetSystemLogs({ limit: 10 });

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchHealth();
      refetchMetrics();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchHealth, refetchMetrics]);

  // Obtener estado del sistema
  const getSystemStatus = () => {
    if (healthLoading) return { status: 'loading', text: 'Verificando...' };
    
    if (!healthData) return { status: 'error', text: 'Sin datos' };

    const { cpu, memory, disk, database } = healthData;
    
    if (cpu?.usage > 90 || memory?.usage > 90 || disk?.usage > 90 || !database?.connected) {
      return { status: 'critical', text: 'Estado crítico' };
    }
    
    if (cpu?.usage > 70 || memory?.usage > 70 || disk?.usage > 80) {
      return { status: 'warning', text: 'Advertencia' };
    }
    
    return { status: 'healthy', text: 'Saludable' };
  };

  const systemStatus = getSystemStatus();

  // Obtener icono del estado
  const getStatusIcon = (status) => {
    const icons = {
      healthy: <CheckCircle className="w-5 h-5 text-green-500" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      critical: <XCircle className="w-5 h-5 text-red-500" />,
      loading: <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />,
      error: <XCircle className="w-5 h-5 text-gray-500" />
    };
    return icons[status] || icons.error;
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
      loading: 'bg-gray-100 text-gray-800 border-gray-200',
      error: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.error;
  };

  // Formatear bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear porcentaje
  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  // Obtener color de progreso
  const getProgressColor = (value) => {
    if (value >= 90) return 'bg-red-500';
    if (value >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitoreo del Sistema</h2>
          <p className="text-gray-600">Estado y métricas del sistema en tiempo real</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Auto-refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              disabled={!autoRefresh}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
          <button
            onClick={() => {
              refetchHealth();
              refetchMetrics();
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={healthLoading || metricsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(healthLoading || metricsLoading) ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estado general del sistema */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Estado del Sistema</h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(systemStatus.status)}`}>
            {getStatusIcon(systemStatus.status)}
            <span className="ml-2">{systemStatus.text}</span>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Cpu className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">CPU</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {healthData?.cpu ? formatPercentage(healthData.cpu.usage) : '-%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  healthData?.cpu ? getProgressColor(healthData.cpu.usage) : 'bg-gray-300'
                }`}
                style={{ width: `${healthData?.cpu?.usage || 0}%` }}
              ></div>
            </div>
            {healthData?.cpu && (
              <div className="mt-2 text-xs text-gray-500">
                Carga: {healthData.cpu.load?.toFixed(2) || 'N/A'}
              </div>
            )}
          </div>

          {/* Memoria */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <MemoryStick className="w-5 h-5 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Memoria</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {healthData?.memory ? formatPercentage(healthData.memory.usage) : '-%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  healthData?.memory ? getProgressColor(healthData.memory.usage) : 'bg-gray-300'
                }`}
                style={{ width: `${healthData?.memory?.usage || 0}%` }}
              ></div>
            </div>
            {healthData?.memory && (
              <div className="mt-2 text-xs text-gray-500">
                {formatBytes(healthData.memory.used)} / {formatBytes(healthData.memory.total)}
              </div>
            )}
          </div>

          {/* Disco */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <HardDrive className="w-5 h-5 text-orange-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Disco</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {healthData?.disk ? formatPercentage(healthData.disk.usage) : '-%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  healthData?.disk ? getProgressColor(healthData.disk.usage) : 'bg-gray-300'
                }`}
                style={{ width: `${healthData?.disk?.usage || 0}%` }}
              ></div>
            </div>
            {healthData?.disk && (
              <div className="mt-2 text-xs text-gray-500">
                {formatBytes(healthData.disk.used)} / {formatBytes(healthData.disk.total)}
              </div>
            )}
          </div>

          {/* Base de datos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Database className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Base de Datos</span>
              </div>
              <span className={`text-lg font-semibold ${
                healthData?.database?.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {healthData?.database?.connected ? 'Conectada' : 'Desconectada'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  healthData?.database?.connected ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: healthData?.database?.connected ? '100%' : '0%' }}
              ></div>
            </div>
            {healthData?.database && (
              <div className="mt-2 text-xs text-gray-500">
                Conexiones: {healthData.database.connections || 0} activas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métricas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servicios del sistema */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Servicios del Sistema</h3>
          <div className="space-y-3">
            {healthData?.services ? (
              Object.entries(healthData.services).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Server className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700 capitalize">{service}</span>
                  </div>
                  <div className="flex items-center">
                    {status ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`ml-2 text-sm ${
                      status ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {status ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Server className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No hay datos de servicios disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {logsLoading ? (
              <div className="text-center py-4">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Cargando actividad...</p>
              </div>
            ) : logsData && logsData.length > 0 ? (
              logsData.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <Activity className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 truncate">
                        {log.description || log.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.user_name} • {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    log.level === 'error' ? 'bg-red-100 text-red-800' :
                    log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {log.level}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas de rendimiento */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas de Rendimiento</h3>
        
        {metricsLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">Cargando métricas...</p>
          </div>
        ) : metricsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {metricsData.active_users || 0}
              </div>
              <div className="text-sm text-gray-500">Usuarios activos</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {metricsData.requests_per_minute || 0}
              </div>
              <div className="text-sm text-gray-500">Req/min</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {metricsData.avg_response_time || 0}ms
              </div>
              <div className="text-sm text-gray-500">Tiempo respuesta</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {metricsData.uptime ? `${Math.round(metricsData.uptime / 3600)}h` : '0h'}
              </div>
              <div className="text-sm text-gray-500">Tiempo activo</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No hay métricas de rendimiento disponibles</p>
          </div>
        )}
      </div>

      {/* Alertas del sistema */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Alertas del Sistema</h3>
        
        <div className="space-y-3">
          {/* Generar alertas basadas en el estado del sistema */}
          {healthData?.cpu?.usage > 80 && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-yellow-800">
                  Alto uso de CPU
                </div>
                <div className="text-sm text-yellow-700">
                  El uso de CPU está en {formatPercentage(healthData.cpu.usage)}
                </div>
              </div>
            </div>
          )}
          
          {healthData?.memory?.usage > 80 && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-yellow-800">
                  Alto uso de memoria
                </div>
                <div className="text-sm text-yellow-700">
                  El uso de memoria está en {formatPercentage(healthData.memory.usage)}
                </div>
              </div>
            </div>
          )}
          
          {healthData?.disk?.usage > 85 && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-red-800">
                  Espacio en disco bajo
                </div>
                <div className="text-sm text-red-700">
                  El uso de disco está en {formatPercentage(healthData.disk.usage)}
                </div>
              </div>
            </div>
          )}
          
          {!healthData?.database?.connected && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-red-800">
                  Base de datos desconectada
                </div>
                <div className="text-sm text-red-700">
                  No se puede conectar a la base de datos
                </div>
              </div>
            </div>
          )}
          
          {/* Si no hay alertas */}
          {systemStatus.status === 'healthy' && (
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-green-800">
                  Sistema funcionando correctamente
                </div>
                <div className="text-sm text-green-700">
                  Todos los componentes están operativos
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;
