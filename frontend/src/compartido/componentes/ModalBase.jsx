/**
 * Modal Base Reutilizable
 * 
 * Componente base para todos los modales del sistema
 * con estilo corporativo y funcionalidades comunes.
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const BaseModal = ({ 
  isOpen, 
  onClose, 
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  size = 'md', // sm, md, lg, xl
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
  className = ''
}) => {
  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll en el body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-2xl',
    full: 'sm:max-w-4xl'
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-lg shadow-xl w-full modal-scroll max-h-[90vh] overflow-y-auto ${sizeClasses[size]} ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {Icon && (
                <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              )}
              {title && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-sm text-gray-500">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;

BaseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.elementType,
  iconColor: PropTypes.string,
  iconBgColor: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  showCloseButton: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};
