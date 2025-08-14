/**
 * Tarjeta de métrica con diseño moderno estilo Meta
 * 
 * Componente reutilizable para mostrar KPIs principales
 * con gradientes sutiles y animaciones suaves
 */

import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  gradient,
  loading = false 
}) => {
  const gradientClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-red-600',
    cyan: 'from-cyan-500 to-blue-600'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2.5 rounded-lg bg-gradient-to-r ${gradientClasses[gradient]} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      
      {/* Value */}
      <div className="mb-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      
      {/* Trend */}
      {trend && (
        <div className="flex items-center">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span 
            className={`text-sm font-medium ${
              trend === 'up' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {trendValue}
          </span>
          <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
