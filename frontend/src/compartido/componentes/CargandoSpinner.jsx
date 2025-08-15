import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Cargando...' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}></div>
      {text && (
        <p className="mt-3 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const LoadingPage = ({ text = 'Cargando aplicación...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto"></div>
        <h2 className="mt-6 text-lg font-medium text-gray-900">{text}</h2>
        <p className="mt-2 text-sm text-gray-600">Por favor espera un momento...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
