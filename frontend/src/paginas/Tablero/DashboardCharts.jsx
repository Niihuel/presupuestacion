/**
 * Dashboard de métricas y gráficos
 * 
 * Panel principal con KPIs, estadísticas y visualizaciones
 * modernas usando Recharts y diseño Meta-style
 */

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  DollarSign, 
  FileText, 
  Users, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

import MetricCard from './MetricCard';
import { useDashboard } from '@compartido/hooks/useDashboard';

const DashboardCharts = () => {
  const [dateRange, setDateRange] = useState('month');
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useDashboard({ range: dateRange });

  // Datos de ejemplo mientras esperamos la API real
  const mockData = {
    metrics: {
      totalQuotations: 156,
      totalRevenue: 2847500,
      totalCustomers: 89,
      conversionRate: 68.5,
      trends: {
        quotations: { value: '+12%', direction: 'up' },
        revenue: { value: '+8.5%', direction: 'up' },
        customers: { value: '+15%', direction: 'up' },
        conversion: { value: '-2.1%', direction: 'down' }
      }
    },
    charts: {
      monthlyRevenue: [
        { name: 'Ene', value: 185000, quotations: 12 },
        { name: 'Feb', value: 220000, quotations: 15 },
        { name: 'Mar', value: 195000, quotations: 13 },
        { name: 'Abr', value: 285000, quotations: 18 },
        { name: 'May', value: 325000, quotations: 22 },
        { name: 'Jun', value: 290000, quotations: 19 }
      ],
      quotationStatus: [
        { name: 'Aprobado', value: 45, color: '#10b981' },
        { name: 'Pendiente', value: 32, color: '#f59e0b' },
        { name: 'En Revisión', value: 28, color: '#3b82f6' },
        { name: 'Rechazado', value: 15, color: '#ef4444' }
      ],
      topZones: [
        { name: 'Zona Norte', quotations: 38, revenue: 850000 },
        { name: 'Zona Centro', quotations: 42, revenue: 920000 },
        { name: 'Zona Sur', quotations: 35, revenue: 780000 },
        { name: 'Zona Este', quotations: 28, revenue: 650000 },
        { name: 'Zona Oeste', quotations: 25, revenue: 580000 }
      ]
    }
  };

  const data = dashboardData || mockData;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-500">No se pudieron cargar las métricas del dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Panel de control y métricas del sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
            <option value="year">Último año</option>
          </select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ingresos Totales"
          value={formatCurrency(data.metrics.totalRevenue)}
          icon={DollarSign}
          trend={data.metrics.trends.revenue.direction}
          trendValue={data.metrics.trends.revenue.value}
          gradient="green"
          loading={isLoading}
        />
        
        <MetricCard
          title="Presupuestos"
          value={data.metrics.totalQuotations}
          icon={FileText}
          trend={data.metrics.trends.quotations.direction}
          trendValue={data.metrics.trends.quotations.value}
          gradient="blue"
          loading={isLoading}
        />
        
        <MetricCard
          title="Clientes"
          value={data.metrics.totalCustomers}
          icon={Users}
          trend={data.metrics.trends.customers.direction}
          trendValue={data.metrics.trends.customers.value}
          gradient="purple"
          loading={isLoading}
        />
        
        <MetricCard
          title="Tasa Conversión"
          value={`${data.metrics.conversionRate}%`}
          icon={TrendingUp}
          trend={data.metrics.trends.conversion.direction}
          trendValue={data.metrics.trends.conversion.value}
          gradient="orange"
          loading={isLoading}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos mensuales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ingresos Mensuales</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              Últimos 6 meses
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.charts.monthlyRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `$${(value / 1000)}K`}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Ingresos']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Estado de presupuestos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Estado de Presupuestos</h3>
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 mr-1" />
              Total: {data.charts.quotationStatus.reduce((sum, item) => sum + item.value, 0)}
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.charts.quotationStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.charts.quotationStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Leyenda */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {data.charts.quotationStatus.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-medium text-gray-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zonas top */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Zona</h3>
          <div className="flex items-center text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 mr-1" />
            Top 5 zonas
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.charts.topZones} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `$${(value / 1000)}K`}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'Ingresos' : 'Presupuestos'
              ]}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
