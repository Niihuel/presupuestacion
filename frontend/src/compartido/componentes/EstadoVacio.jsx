/**
 * Componente de Estado Vacío
 * 
 * Componente reutilizable para estados vacíos con diseño moderno
 */

import { Plus, Search, FileX, AlertCircle } from 'lucide-react';

const EstadoVacio = ({ 
  icon: Icon = FileX,
  title = "No hay elementos",
  description = "No se encontraron elementos para mostrar",
  actionLabel,
  onAction,
  variant = "default" // default, search, error
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'search':
        return {
          icon: Search,
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-900',
          descColor: 'text-blue-600'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          iconColor: 'text-red-400',
          titleColor: 'text-red-900',
          descColor: 'text-red-600'
        };
      default:
        return {
          icon: Icon,
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-400',
          titleColor: 'text-gray-900',
          descColor: 'text-gray-500'
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = styles.icon;

  return (
    <div className="text-center py-12">
      <div className={`mx-auto w-24 h-24 ${styles.bgColor} rounded-full flex items-center justify-center mb-6`}>
        <IconComponent className={`w-12 h-12 ${styles.iconColor}`} />
      </div>
      
      <h3 className={`text-lg font-medium ${styles.titleColor} mb-2`}>
        {title}
      </h3>
      
      <p className={`text-sm ${styles.descColor} mb-6 max-w-sm mx-auto`}>
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EstadoVacio;
