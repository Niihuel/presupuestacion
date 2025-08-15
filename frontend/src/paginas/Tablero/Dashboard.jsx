/**
 * Dashboard Principal - Redesign 4.0
 * 
 * Dashboard moderno con barra superior única y diseño limpio
 * basado en los principios de diseño corporativo con datos reales
 */

import { 
  Plus, 
  AlertTriangle, 
  Users,
  TrendingUp,
  FileText,
  Building2,
  ArrowUp,
  ArrowDown,
  Database,
  BarChart3,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTablero as useDashboard } from '@compartido/hooks';
import { useState } from 'react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState('month');
  
  // Obtener datos del dashboard con rango seleccionado
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useDashboard({ range: selectedRange });

  // Estados de carga
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar el dashboard</h3>
            <p className="text-gray-600 mb-4">
              No se pudieron cargar las estadísticas. Por favor, intenta nuevamente.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Métricas principales con datos reales
  const mainMetrics = [
    { 
      label: 'Presupuestos', 
      value: dashboardData?.metrics?.totalQuotations || 0, 
      change: dashboardData?.metrics?.change?.quotations || '0%',
      changeType: dashboardData?.metrics?.change?.quotations?.startsWith('+') ? 'positive' : 'negative',
      icon: FileText, 
      color: 'text-blue-600 bg-blue-50'
    },
    { 
      label: 'Clientes', 
      value: dashboardData?.metrics?.totalCustomers || 0, 
      change: dashboardData?.metrics?.change?.customers || '0%',
      changeType: dashboardData?.metrics?.change?.customers?.startsWith('+') ? 'positive' : 'negative',
      icon: Users, 
      color: 'text-purple-600 bg-purple-50'
    },
    { 
      label: 'Proyectos', 
      value: dashboardData?.metrics?.totalProjects || 0, 
      change: dashboardData?.metrics?.change?.projects || '0%',
      changeType: dashboardData?.metrics?.change?.projects?.startsWith('+') ? 'positive' : 'negative',
      icon: Building2, 
      color: 'text-emerald-600 bg-emerald-50'
    },
    { 
      label: 'Zonas Activas', 
      value: dashboardData?.metrics?.totalZones || 0, 
      change: 'N/A',
      changeType: 'neutral',
      icon: TrendingUp, 
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  // Componente para mostrar estado vacío
  const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
    <div className="text-center py-12">
      <Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          {actionText}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-lg text-gray-600 mt-1">Panel de control y métricas del sistema</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select 
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="quarter">Último trimestre</option>
              <option value="year">Último año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {mainMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  {metric.changeType !== 'neutral' && (
                    <div className={`ml-2 flex items-center text-sm font-medium ${
                      metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.changeType === 'positive' ? (
                        <ArrowUp className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDown className="h-4 w-4 mr-1" />
                      )}
                      {metric.change}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accesos Rápidos */}
      {/* Accesos Rápidos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              name: 'Nueva Presupuestación', 
              icon: Plus,
              action: () => navigate('/presupuestos/wizard'),
              color: 'bg-blue-600 hover:bg-blue-700'
            },
            { 
              name: 'Ver Proyectos', 
              icon: Building2,
              action: () => navigate('/proyectos'),
              color: 'bg-emerald-600 hover:bg-emerald-700'
            },
            { 
              name: 'Ver Presupuestos', 
              icon: FileText,
              action: () => navigate('/presupuestos'),
              color: 'bg-purple-600 hover:bg-purple-700'
            },
            { 
              name: 'Gestionar Zonas', 
              icon: TrendingUp,
              action: () => navigate('/zonas'),
              color: 'bg-orange-600 hover:bg-orange-700'
            }
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${item.color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
            >
              <item.icon className="h-5 w-5 mr-2" />
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido Principal basado en disponibilidad de datos */}
      {!dashboardData?.hasData ? (
        // Estado vacío general
        <div className="bg-white rounded-lg shadow-md p-8">
          <EmptyState
            icon={Database}
            title="¡Bienvenido al Sistema de Presupuestación!"
            description="Parece que estás comenzando. Crea tu primer presupuesto o agrega algunos clientes para ver las estadísticas aquí."
            actionText="Nueva Presupuestación"
            onAction={() => navigate('/presupuestos/wizard')}
          />
        </div>
      ) : (
        <>
          {/* Gráficos y Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estado de Presupuestos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Estado de Presupuestos</h3>
              
              {dashboardData?.isEmpty?.quotations || !dashboardData?.charts?.quotationStatus?.length ? (
                <EmptyState
                  icon={BarChart3}
                  title="Sin presupuestos"
                  description="No hay presupuestos para mostrar en este período."
                  actionText="Nueva Presupuestación"
                  onAction={() => navigate('/presupuestos/wizard')}
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData.charts.quotationStatus.map((status, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: status.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{status.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{status.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Zonas */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Zonas con Mayor Actividad</h3>
              
              {dashboardData?.isEmpty?.zones || !dashboardData?.charts?.topZones?.length ? (
                <EmptyState
                  icon={Building2}
                  title="Sin actividad por zonas"
                  description="No hay datos de zonas para mostrar en este período."
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData.charts.topZones.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{zone.name}</h4>
                        <p className="text-sm text-gray-600">{zone.quotations} presupuestos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${zone.revenue?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">ingresos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Actividad Reciente</h3>
            
            {dashboardData?.isEmpty?.activity || !dashboardData?.recentActivity?.length ? (
              <EmptyState
                icon={Activity}
                title="Sin actividad reciente"
                description="No hay actividad reciente para mostrar."
              />
            ) : (
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'quotation' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {activity.type === 'quotation' ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
