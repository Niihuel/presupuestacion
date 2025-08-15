/**
 * Componente de estadística rápida
 * 
 * Card compacta para mostrar métricas pequeñas y KPIs secundarios
 * con íconos y colores distintivos
 */

const QuickStat = ({ 
  label, 
  value, 
  icon: Icon, 
  color = 'blue',
  size = 'sm',
  loading = false 
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
    gray: 'text-gray-600 bg-gray-50'
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${sizeClasses[size]} animate-pulse`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${sizeClasses[size]} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-lg font-bold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickStat;
