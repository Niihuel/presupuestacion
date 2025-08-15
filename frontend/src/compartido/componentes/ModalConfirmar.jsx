/**
 * Modal de Confirmación Reutilizable
 * 
 * Componente para confirmaciones con diferentes tipos
 * de acciones (eliminar, confirmar, advertir, etc.)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import ModalBase from './ModalBase.jsx';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  message,
  description,
  type = 'warning', // warning, danger, success, info
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  size = 'sm',
  ...props
}) => {
  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBgColor: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    danger: {
      icon: Trash2,
      iconColor: 'text-red-600',
      iconBgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    },
    info: {
      icon: AlertCircle,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const config = typeConfig[type];

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={config.icon}
      iconColor={config.iconColor}
      iconBgColor={config.iconBgColor}
      size={size}
      {...props}
    >
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          {message}
        </p>
        {description && (
          <p className={`text-xs p-3 rounded-md ${
            type === 'danger' ? 'text-red-600 bg-red-50' :
            type === 'warning' ? 'text-yellow-600 bg-yellow-50' :
            type === 'success' ? 'text-green-600 bg-green-50' :
            'text-blue-600 bg-blue-50'
          }`}>
            {description}
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${config.buttonColor}`}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </button>
      </div>
    </ModalBase>
  );
};

export default ConfirmModal;

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  type: PropTypes.oneOf(['warning', 'danger', 'success', 'info']),
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isLoading: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};
