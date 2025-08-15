/**
 * Modal de Formulario Reutilizable
 * 
 * Componente para modales con formularios que incluye
 * botones de acción y manejo de estados de carga.
 */

import React from 'react';
import ModalBase from './ModalBase.jsx';

const FormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  title,
  subtitle,
  icon,
  iconColor,
  iconBgColor,
  size = 'md',
  isLoading = false,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  submitButtonColor = 'blue',
  showCancelButton = true,
  children,
  className = '',
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const submitColorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      iconBgColor={iconBgColor}
      size={size}
      className={className}
      {...props}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {children}
        
        {/* Botones */}
        <div className="flex justify-end space-x-2 pt-4">
          {showCancelButton && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${submitColorClasses[submitButtonColor]}`}
          >
            {isLoading ? 'Guardando...' : submitText}
          </button>
        </div>
      </form>
    </ModalBase>
  );
};

export default FormModal;
