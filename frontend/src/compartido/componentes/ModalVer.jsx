/**
 * Modal de Vista/Información Reutilizable
 * 
 * Componente para mostrar información detallada
 * sin opciones de edición, solo lectura.
 */

import React from 'react';
import BaseModal from './BaseModal';

const ViewModal = ({ 
  isOpen, 
  onClose, 
  title,
  subtitle,
  icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  size = 'lg',
  closeText = 'Cerrar',
  showCloseButton = true,
  children,
  className = '',
  ...props
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      iconBgColor={iconBgColor}
      size={size}
      showCloseButton={showCloseButton}
      className={className}
      {...props}
    >
      {children}
      
      {/* Footer con botón de cerrar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {closeText}
        </button>
      </div>
    </BaseModal>
  );
};

export default ViewModal;
