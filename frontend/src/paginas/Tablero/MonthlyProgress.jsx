/**
 * Componente de progreso mensual
 * 
 * Muestra el progreso hacia las metas mensuales con barra
 * de progreso animada y porcentaje de completitud
 */

import { Target, TrendingUp, Calendar } from 'lucide-react';

const MonthlyProgress = ({ 
  title = "Progreso Mensual",
  current = 0, 
  target = 100, 
  label = "Presupuestos",
  color = "blue",
  loading = false 
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isOverTarget = current > target;
  
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      lightBg: 'bg-blue-100',
      text: 'text-blue-600',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-500',
      lightBg: 'bg-green-100', 
      text: 'text-green-600',
      icon: 'text-green-500'
    },
    orange: {
      bg: 'bg-orange-500',
      lightBg: 'bg-orange-100',
      text: 'text-orange-600', 
      icon: 'text-orange-500'
    },
    purple: {
      bg: 'bg-purple-500',
      lightBg: 'bg-purple-100',
      text: 'text-purple-600',
      icon: 'text-purple-500'
    }
  };

  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className={`p-2 rounded-lg ${colors.lightBg}`}>
          <Target className={`h-5 w-5 ${colors.icon}`} />
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Números actuales */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-bold text-gray-900">{current}</p>
            <p className="text-sm text-gray-500">{label} completados</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-700">{target}</p>
            <p className="text-sm text-gray-500">Meta</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              isOverTarget ? 'bg-green-500' : colors.bg
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>

        {/* Estadísticas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOverTarget ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <Calendar className="h-4 w-4 text-gray-400" />
            )}
            <span className={`text-sm font-medium ${
              isOverTarget ? 'text-green-600' : colors.text
            }`}>
              {isOverTarget ? '¡Meta superada!' : `${percentage.toFixed(1)}% completado`}
            </span>
          </div>
          
          {!isOverTarget && (
            <span className="text-sm text-gray-500">
              {target - current} restantes
            </span>
          )}
        </div>

        {/* Mensaje de estado */}
        {isOverTarget && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              🎉 ¡Excelente trabajo! Has superado la meta mensual en {current - target} {label.toLowerCase()}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyProgress;
