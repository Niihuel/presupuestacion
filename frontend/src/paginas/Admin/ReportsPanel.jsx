/**
 * Componente ReportsPanel
 * 
 * Panel de reportes y estadísticas del sistema

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  BadgeDollarSign,
  Target,
  PieChart,
  LineChart,
  Activity,
  RefreshCw,
  Eye,
  Share2,
  Settings,
  Mail
} from 'lucide-react';
import { useAdminHook } from '../../shared/hooks/useAdminHook';

const ReportsPanel = () => {
  const { 
    useGetReports,
    useGenerateReport,
    useExportReport,
    useGetReportTemplates
  } = useAdminHook();

  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days');
  const [selectedReport, setSelectedReport] = useState('summary');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({
    users: [],
    departments: [],
    status: []
  });

  const { 
    data: reportsData, 
    isLoading: reportsLoading, 
    refetch: refetchReports 
  } = useGetReports({ 
    period: selectedPeriod,
    customDateRange,
    filters 
  });

  const { data: templates = [] } = useGetReportTemplates();
  const generateMutation = useGenerateReport();
  const exportMutation = useExportReport();

  // Períodos predefinidos
  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last_7_days', label: 'Últimos 7 días' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'last_90_days', label: 'Últimos 90 días' },
    { value: 'this_month', label: 'Este mes' },
    { value: 'last_month', label: 'Mes pasado' },
    { value: 'this_year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Tipos de reportes
  const reportTypes = [
    { value: 'summary', label: 'Resumen general', icon: BarChart3 },
    { value: 'users', label: 'Usuarios', icon: Users },
    { value: 'quotations', label: 'Presupuestos', icon: FileText },
    { value: 'financial', label: 'Financiero', icon: BadgeDollarSign },
    { value: 'performance', label: 'Rendimiento', icon: Target },
    { value: 'activity', label: 'Actividad', icon: Activity }
  ];

  // Generar reporte
  const handleGenerateReport = async (reportType, format = 'pdf') => {
    try {
      await generateMutation.mutateAsync({
        type: reportType,
        period: selectedPeriod,
        customDateRange,
        filters,
        format
      });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // Exportar reporte
  const handleExportReport = async (format) => {
    try {
      await exportMutation.mutateAsync({
        type: selectedReport,
        period: selectedPeriod,
        customDateRange,
        filters,
        format
      });
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  // Formatear números
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel de Reportes</h2>
          <p className="text-gray-600">Reportes y estadísticas del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetchReports()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={reportsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${reportsLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => handleExportReport('pdf')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            disabled={exportMutation.isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isLoading ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de reporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de reporte
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha inicio (solo si es personalizado) */}
          {selectedPeriod === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha desde
              </label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  startDate: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          )}

          {/* Fecha fin (solo si es personalizado) */}
          {selectedPeriod === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha hasta
              </label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      {reportsLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Generando reportes...</p>
        </div>
      ) : reportsData ? (
        <>
          {/* Resumen de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(reportsData.summary?.total_users || 0)}
                  </p>
                  <div className="flex items-center mt-2">
                    {reportsData.summary?.users_change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      reportsData.summary?.users_change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(reportsData.summary?.users_change || 0)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Presupuestos</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(reportsData.summary?.total_quotations || 0)}
                  </p>
                  <div className="flex items-center mt-2">
                    {reportsData.summary?.quotations_change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      reportsData.summary?.quotations_change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(reportsData.summary?.quotations_change || 0)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Ingresos</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(reportsData.summary?.total_revenue || 0)}
                  </p>
                  <div className="flex items-center mt-2">
                    {reportsData.summary?.revenue_change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      reportsData.summary?.revenue_change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(reportsData.summary?.revenue_change || 0)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <BadgeDollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Tasa Conversión</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(reportsData.summary?.conversion_rate || 0).toFixed(1)}%
                  </p>
                  <div className="flex items-center mt-2">
                    {reportsData.summary?.conversion_change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      reportsData.summary?.conversion_change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(reportsData.summary?.conversion_change || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos y tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de tendencias */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tendencias</h3>
                <LineChart className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Gráfico de tendencias</p>
                  <p className="text-sm text-gray-400">
                    Aquí se mostraría un gráfico de líneas con las tendencias
                  </p>
                </div>
              </div>
            </div>

            {/* Distribución por categorías */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Distribución</h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Gráfico de distribución</p>
                  <p className="text-sm text-gray-400">
                    Aquí se mostraría un gráfico de pastel con la distribución
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de datos detallados */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Datos Detallados</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExportReport('csv')}
                    className="text-sm text-purple-600 hover:text-purple-700"
                    disabled={exportMutation.isLoading}
                  >
                    Exportar CSV
                  </button>
                  <button
                    onClick={() => handleExportReport('excel')}
                    className="text-sm text-purple-600 hover:text-purple-700"
                    disabled={exportMutation.isLoading}
                  >
                    Exportar Excel
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {reportsData.details && reportsData.details.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportsData.details.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.user}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay datos detallados disponibles para este período</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay datos de reportes disponibles</p>
          <button
            onClick={() => refetchReports()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Cargar reportes
          </button>
        </div>
      )}

      {/* Plantillas de reportes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Plantillas de Reportes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length > 0 ? (
            templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleGenerateReport(template.type)}
                      className="p-1 text-gray-400 hover:text-purple-600"
                      title="Generar reporte"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExportReport('pdf')}
                      className="p-1 text-gray-400 hover:text-purple-600"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Actualizado: {new Date(template.updated_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay plantillas de reportes disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;
