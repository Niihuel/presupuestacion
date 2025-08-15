/**
 * Dialog de Confirmación
 * 
 * Componente reutilizable para mostrar dialogs de confirmación
 * con diferentes variantes y estados de carga
 */

import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { Spinner } from './EstadoCargando';

const VARIANTS = {
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
  },
  danger: {
    icon: XCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
  }
};

const DialogoConfirmacion = ({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'info',
  showIcon = true,
  confirmButtonProps = {},
  cancelButtonProps = {}
}) => {
  const variantConfig = VARIANTS[variant] || VARIANTS.info;
  const Icon = variantConfig.icon;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onCancel();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-4">
            {showIcon && (
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${variantConfig.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${variantConfig.iconColor}`} />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <div className="text-sm text-gray-600">
                {typeof message === 'string' ? (
                  <p>{message}</p>
                ) : (
                  message
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 rounded-b-lg flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            {...cancelButtonProps}
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variantConfig.buttonColor}`}
            {...confirmButtonProps}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogoConfirmacion;

DialogoConfirmacion.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'danger']),
  showIcon: PropTypes.bool,
  confirmButtonProps: PropTypes.object,
  cancelButtonProps: PropTypes.object,
};
