/**
 * Loading State Component
 * 
 * Componente reutilizable para estados de carga con skeletons modernos
 */

import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// Componente de Spinner básico
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
};

// Skeleton para cards
export const CardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
    </div>
    
    <div className="space-y-3">
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
    
    <div className="flex gap-2 mt-4">
      <div className="h-8 bg-gray-200 rounded w-20"></div>
      <div className="h-8 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

// Skeleton para listas
export const ListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Loading overlay completo
export const LoadingOverlay = ({ message = "Cargando..." }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Spinner size="lg" className="text-blue-600 mb-4" />
    <p className="text-gray-600 text-sm">{message}</p>
  </div>
);

// Grid de skeletons para cards
export const CardGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Error State Component
export const ErrorState = ({ 
  message = "Ha ocurrido un error", 
  onRetry = null,
  icon: Icon = AlertCircle,
  className = ""
}) => (
  <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-red-600" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Oops!</h3>
    <p className="text-gray-600 text-center mb-6 max-w-md">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Reintentar
      </button>
    )}
  </div>
);

const LoadingState = { 
  Spinner, 
  CardSkeleton, 
  ListSkeleton, 
  LoadingOverlay, 
  CardGridSkeleton 
};

export default LoadingState;
