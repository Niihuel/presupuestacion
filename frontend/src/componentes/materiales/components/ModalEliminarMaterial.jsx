/**
 * Modal de confirmación para eliminar materiales
 * 
 * Muestra advertencias sobre:
 * - Piezas que usan el material
 * - Stock disponible en plantas
 * - Consecuencias de la eliminación
 */

import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  AlertTriangle,
  Package,
  Factory,
  Layers
} from 'lucide-react';

const MaterialDeleteModal = ({ material, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== 'eliminar') {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const hasStock = material.stats?.totalStock > 0;
  const hasAssociatedPieces = material.stats?.associatedPieces > 0;
  const hasMultiplePlants = material.stats?.plantsCount > 1;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Eliminar Material</h2>
            <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  ¿Estás seguro de que quieres eliminar "{material.name}"?
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Esta acción eliminará permanentemente el material y toda su información asociada.
                </p>
              </div>
            </div>
          </div>

          {/* Información del material a eliminar */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Material a eliminar:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium text-gray-900">{material.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Código:</span>
                <span className="font-medium text-gray-900">{material.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categoría:</span>
                <span className="font-medium text-gray-900">{material.category || 'Sin categoría'}</span>
              </div>
            </div>
          </div>

          {/* Advertencias específicas */}
          {(hasStock || hasAssociatedPieces || hasMultiplePlants) && (
            <div className="mb-6 space-y-3">
              <h4 className="font-medium text-gray-900">Advertencias importantes:</h4>
              
              {hasStock && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Package className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Stock disponible: {material.stats.totalStock} {material.unit}
                    </p>
                    <p className="text-sm text-orange-600">
                      Se perderá el registro de todo el stock disponible en las plantas.
                    </p>
                  </div>
                </div>
              )}

              {hasAssociatedPieces && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Layers className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Usado en {material.stats.associatedPieces} pieza(s)
                    </p>
                    <p className="text-sm text-orange-600">
                      Las piezas que usan este material pueden verse afectadas.
                    </p>
                  </div>
                </div>
              )}

              {hasMultiplePlants && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Factory className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Disponible en {material.stats.plantsCount} plantas
                    </p>
                    <p className="text-sm text-orange-600">
                      Se eliminarán los precios y stock en todas las plantas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirmación */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, escribe "eliminar" en el campo de abajo:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="eliminar"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmText.toLowerCase() !== 'eliminar' || isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? 'Eliminando...' : 'Eliminar Material'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDeleteModal;
