/**
 * Modal de confirmación para eliminar proyectos
 * 
 * Modal especializado para confirmar la eliminación de proyectos con:
 * - Información del proyecto a eliminar
 * - Advertencias sobre las consecuencias
 * - Confirmación requerida para proceder
 */

import { useState } from 'react';
import { AlertTriangle, Building, X, Trash2, Loader2 } from 'lucide-react';

const ProjectDeleteModal = ({ isOpen, onClose, onConfirm, project }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== 'eliminar') {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm(project.id);
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      onClose();
    }
  };

  if (!isOpen || !project) return null;

  const isConfirmValid = confirmText.toLowerCase() === 'eliminar';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Eliminar Proyecto
                  </h3>
                  <p className="text-sm text-gray-500">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Información del proyecto */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Building className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {project.name}
                    </h4>
                    {project.code && (
                      <p className="text-xs text-gray-500">#{project.code}</p>
                    )}
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Advertencias */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-800">
                      Consecuencias de eliminar este proyecto:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Se eliminarán todos los presupuestos asociados</li>
                      <li>• Se perderán todas las cotizaciones relacionadas</li>
                      <li>• Se eliminará el historial del proyecto</li>
                      <li>• Esta acción no se puede deshacer</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Confirmación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para confirmar, escribe <span className="font-semibold">eliminar</span> en el campo de abajo:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isDeleting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  placeholder="eliminar"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting || !isConfirmValid}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Proyecto
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDeleteModal;
