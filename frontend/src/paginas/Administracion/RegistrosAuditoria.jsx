/**
 * Componente AuditLogs
 * 
 * Sistema de logs de auditoría con filtrado avanzado y exportación
 */

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useAdminHook } from '../../shared/hooks/useAdminHook';

const AuditLogs = () => {
  const { useGetAuditLogs, useExportAuditLogs } = useAdminHook();
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    user: '',
    level: '',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { 
    data: logsData, 
    isLoading, 
    refetch 
  } = useGetAuditLogs({ ...filters, ...pagination });

  const exportMutation = useExportAuditLogs();

  const logs = logsData?.logs || [];
  const totalPages = Math.ceil((logsData?.total || 0) / pagination.limit);

  // Tipos de acciones disponibles
  const actionTypes = [
    { value: '', label: 'Todas las acciones' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'create', label: 'Crear' },
    { value: 'update', label: 'Actualizar' },
    { value: 'delete', label: 'Eliminar' },
    { value: 'export', label: 'Exportar' },
    { value: 'import', label: 'Importar' },
    { value: 'approve', label: 'Aprobar' },
    { value: 'reject', label: 'Rechazar' }
  ];

  // Niveles de log
  const logLevels = [
    { value: '', label: 'Todos los niveles' },
    { value: 'info', label: 'Información' },
    { value: 'warning', label: 'Advertencia' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Crítico' }
  ];

  // Obtener icono del nivel de log
  const getLevelIcon = (level) => {
    const icons = {
      info: <Info className="w-4 h-4 text-blue-500" />,
      warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      error: <XCircle className="w-4 h-4 text-red-500" />,
      critical: <AlertTriangle className="w-4 h-4 text-red-600" />,
      success: <CheckCircle className="w-4 h-4 text-green-500" />
    };
    return icons[level] || <Info className="w-4 h-4 text-gray-500" />;
  };

  // Obtener color del nivel
  const getLevelColor = (level) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900',
      success: 'bg-green-100 text-green-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      action: '',
      user: '',
      level: '',
      search: ''
    });
    setPagination({ page: 1, limit: 25 });
  };

  // Exportar logs
  const handleExport = async (format = 'csv') => {
    try {
      await exportMutation.mutateAsync({
        filters,
        format
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Obtener descripción de la acción
  const getActionDescription = (log) => {
    const descriptions = {
      login: 'Inicio de sesión',
      logout: 'Cierre de sesión',
      create: 'Creación',
      update: 'Actualización',
      delete: 'Eliminación',
      export: 'Exportación',
      import: 'Importación',
      approve: 'Aprobación',
      reject: 'Rechazo'
    };
    return descriptions[log.action] || log.action;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logs de Auditoría</h2>
          <p className="text-gray-600">Seguimiento de actividades del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            disabled={exportMutation.isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isLoading ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Fecha inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Fecha fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Acción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acción
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Nivel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel
            </label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              {logLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Límite por página */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mostrar
            </label>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination(prev => ({ 
                ...prev, 
                limit: parseInt(e.target.value),
                page: 1
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={10}>10 registros</option>
              <option value={25}>25 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
            </select>
          </div>

          {/* Botón limpiar */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron logs con los filtros aplicados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recurso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nivel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.user_name || 'Sistema'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Activity className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {getActionDescription(log)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resource || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getLevelIcon(log.level)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>
                            {log.level}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, logsData?.total || 0)} de{' '}
                  {logsData?.total || 0} registros
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Página {pagination.page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalle */}
      {showDetailModal && selectedLog && (
        <LogDetailModal
          log={selectedLog}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

// Componente LogDetailModal
const LogDetailModal = ({ log, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Detalle del Log
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID</label>
                <p className="mt-1 text-sm text-gray-900">{log.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha/Hora</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(log.created_at).toLocaleString('es-ES')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Usuario</label>
                <p className="mt-1 text-sm text-gray-900">
                  {log.user_name || 'Sistema'} ({log.user_email})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">IP</label>
                <p className="mt-1 text-sm text-gray-900">{log.ip_address || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Acción</label>
                <p className="mt-1 text-sm text-gray-900">{log.action}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Recurso</label>
                <p className="mt-1 text-sm text-gray-900">{log.resource || '-'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <p className="mt-1 text-sm text-gray-900">{log.description || '-'}</p>
            </div>

            {log.details && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Detalles</label>
                <pre className="mt-1 text-xs text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}

            {log.user_agent && (
              <div>
                <label className="block text-sm font-medium text-gray-700">User Agent</label>
                <p className="mt-1 text-xs text-gray-900 break-all">{log.user_agent}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
