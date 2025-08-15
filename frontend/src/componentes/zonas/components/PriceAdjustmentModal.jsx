/**
 * Modal para ajuste masivo de precios
 * 
 * Permite aplicar ajustes de precios a múltiples materiales:
 * - Ajuste por porcentaje o valor fijo
 * - Filtros por categoría de material
 * - Vista previa de cambios
 * - Aplicación masiva
 */

import { useState, useEffect } from 'react';
import { X, TrendingUp, Calculator, Eye, Save, Loader2, AlertTriangle } from 'lucide-react';

const ADJUSTMENT_TYPES = [
  { value: 'percentage', label: 'Porcentaje (%)', icon: '%' },
  { value: 'fixed', label: 'Valor fijo', icon: '$' }
];

const ADJUSTMENT_OPERATIONS = [
  { value: 'increase', label: 'Aumentar', className: 'text-green-600' },
  { value: 'decrease', label: 'Disminuir', className: 'text-red-600' },
  { value: 'set', label: 'Establecer', className: 'text-blue-600' }
];

const PriceAdjustmentModal = ({ isOpen, onClose, onApply, zone, materials = [], categories = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [adjustment, setAdjustment] = useState({
    type: 'percentage',
    operation: 'increase',
    value: 0,
    selectedCategories: [],
    selectedMaterials: [],
    applyToAll: true
  });

  const [previewData, setPreviewData] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setAdjustment({
        type: 'percentage',
        operation: 'increase',
        value: 0,
        selectedCategories: [],
        selectedMaterials: [],
        applyToAll: true
      });
      setShowPreview(false);
      setPreviewData([]);
    }
  }, [isOpen]);

  const filteredMaterials = materials.filter(material => {
    if (adjustment.applyToAll) return true;
    if (adjustment.selectedCategories.length > 0) {
      return adjustment.selectedCategories.includes(material.category);
    }
    return adjustment.selectedMaterials.includes(material.id);
  });

  const calculateNewPrice = (currentPrice, adjustmentConfig) => {
    const { type, operation, value } = adjustmentConfig;
    
    if (type === 'percentage') {
      switch (operation) {
        case 'increase':
          return currentPrice * (1 + value / 100);
        case 'decrease':
          return currentPrice * (1 - value / 100);
        case 'set':
          return currentPrice; // No aplica para porcentaje
        default:
          return currentPrice;
      }
    } else {
      switch (operation) {
        case 'increase':
          return currentPrice + value;
        case 'decrease':
          return Math.max(0, currentPrice - value);
        case 'set':
          return value;
        default:
          return currentPrice;
      }
    }
  };

  const generatePreview = () => {
    const preview = filteredMaterials.map(material => {
      const currentPrice = material.price || 0;
      const newPrice = calculateNewPrice(currentPrice, adjustment);
      const difference = newPrice - currentPrice;
      const percentChange = currentPrice > 0 ? (difference / currentPrice) * 100 : 0;

      return {
        ...material,
        currentPrice,
        newPrice: Math.max(0, newPrice),
        difference,
        percentChange
      };
    });

    setPreviewData(preview);
    setShowPreview(true);
  };

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      const adjustmentData = {
        zoneId: zone.id,
        adjustment,
        materials: previewData.map(item => ({
          materialId: item.id,
          currentPrice: item.currentPrice,
          newPrice: item.newPrice
        }))
      };
      
      await onApply(adjustmentData);
      onClose();
    } catch (error) {
      console.error('Error applying price adjustment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !zone) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ajuste Masivo de Precios
                  </h3>
                  <p className="text-sm text-gray-500">
                    Zona: {zone.name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuración */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    Configuración del Ajuste
                  </h4>

                  {/* Tipo de ajuste */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Ajuste
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ADJUSTMENT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setAdjustment(prev => ({ ...prev, type: type.value }))}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                            adjustment.type === type.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Operación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operación
                    </label>
                    <select
                      value={adjustment.operation}
                      onChange={(e) => setAdjustment(prev => ({ ...prev, operation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {ADJUSTMENT_OPERATIONS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor {adjustment.type === 'percentage' ? '(%)' : '($)'}
                    </label>
                    <input
                      type="number"
                      step={adjustment.type === 'percentage' ? '0.1' : '0.01'}
                      min="0"
                      value={adjustment.value}
                      onChange={(e) => setAdjustment(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={adjustment.type === 'percentage' ? '10' : '100.00'}
                    />
                  </div>
                </div>

                {/* Filtros */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Materiales a Ajustar
                  </h4>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={adjustment.applyToAll}
                        onChange={() => setAdjustment(prev => ({ ...prev, applyToAll: true }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Todos los materiales ({materials.length})
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!adjustment.applyToAll}
                        onChange={() => setAdjustment(prev => ({ ...prev, applyToAll: false }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Filtrar por categorías
                      </span>
                    </label>

                    {!adjustment.applyToAll && (
                      <div className="ml-6 space-y-2 max-h-32 overflow-y-auto">
                        {categories.map((category) => (
                          <label key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={adjustment.selectedCategories.includes(category)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setAdjustment(prev => ({
                                  ...prev,
                                  selectedCategories: checked
                                    ? [...prev.selectedCategories, category]
                                    : prev.selectedCategories.filter(c => c !== category)
                                }));
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              {category}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de vista previa */}
                <button
                  onClick={generatePreview}
                  disabled={adjustment.value <= 0}
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Vista Previa ({filteredMaterials.length} materiales)
                </button>
              </div>

              {/* Vista previa */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Vista Previa de Cambios
                </h4>

                {showPreview ? (
                  <div className="border border-gray-200 rounded-lg">
                    <div className="max-h-96 overflow-y-auto">
                      {previewData.map((item, index) => (
                        <div
                          key={item.id}
                          className={`p-3 border-b border-gray-100 last:border-b-0 ${
                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                  ${item.currentPrice.toFixed(2)}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="text-sm font-medium text-gray-900">
                                  ${item.newPrice.toFixed(2)}
                                </span>
                              </div>
                              <p className={`text-xs ${
                                item.difference > 0 ? 'text-green-600' : 
                                item.difference < 0 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {item.difference > 0 ? '+' : ''}
                                {item.difference.toFixed(2)} ({item.percentChange.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Calculator className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Configura el ajuste y haz clic en "Vista Previa" para ver los cambios
                    </p>
                  </div>
                )}

                {showPreview && previewData.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-medium mb-1">Resumen del ajuste:</p>
                        <ul className="text-xs space-y-1">
                          <li>• {previewData.length} materiales serán modificados</li>
                          <li>• Los precios se actualizarán inmediatamente</li>
                          <li>• Esta acción no se puede deshacer</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 flex-shrink-0 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={isSubmitting || !showPreview || previewData.length === 0}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Aplicar Ajuste
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceAdjustmentModal;
