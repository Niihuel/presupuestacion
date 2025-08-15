/**
 * Modal de Ajuste de Precios usando FormModal Reutilizable
 * 
 * Modal refactorizado para aplicar ajustes masivos de precios en zonas
 * usando el sistema de modales corporativo.
 */

import React, { useState, useEffect } from 'react';
import { FormModal } from '@compartido/componentes/modals';
import { 
  Percent, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Settings
} from 'lucide-react';
import { 
  useZones, 
  useApplyPriceAdjustment 
} from '@compartido/hooks/useZonas';

const PriceAdjustmentModal = ({ 
  isOpen, 
  onClose, 
  selectedZones = [] 
}) => {
  const [formData, setFormData] = useState({
    adjustmentType: 'percentage', // 'percentage', 'fixed', 'formula'
    adjustmentValue: '',
    adjustmentDirection: 'increase', // 'increase', 'decrease'
    applyToCategories: [],
    minPrice: '',
    maxPrice: '',
    roundPrices: true,
    roundingPrecision: 2
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errors, setErrors] = useState({});

  // Hooks
  const { data: zones = [] } = useZones();
  const applyAdjustment = useApplyPriceAdjustment();

  // Categorías de precios disponibles
  const priceCategories = [
    { id: 'materials', name: 'Materiales', icon: '🔧' },
    { id: 'labor', name: 'Mano de Obra', icon: '👷' },
    { id: 'equipment', name: 'Equipos', icon: '⚙️' },
    { id: 'services', name: 'Servicios', icon: '🔧' },
    { id: 'overhead', name: 'Gastos Generales', icon: '📊' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        adjustmentType: 'percentage',
        adjustmentValue: '',
        adjustmentDirection: 'increase',
        applyToCategories: [],
        minPrice: '',
        maxPrice: '',
        roundPrices: true,
        roundingPrecision: 2
      });
      setPreviewMode(false);
      setPreviewData(null);
      setErrors({});
    }
  }, [isOpen]);

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.adjustmentValue || parseFloat(formData.adjustmentValue) === 0) {
      newErrors.adjustmentValue = 'Debe especificar un valor de ajuste';
    }

    if (formData.adjustmentType === 'percentage') {
      const percentage = parseFloat(formData.adjustmentValue);
      if (percentage < -99 || percentage > 1000) {
        newErrors.adjustmentValue = 'El porcentaje debe estar entre -99% y 1000%';
      }
    }

    if (formData.minPrice && formData.maxPrice) {
      const min = parseFloat(formData.minPrice);
      const max = parseFloat(formData.maxPrice);
      if (min >= max) {
        newErrors.maxPrice = 'El precio máximo debe ser mayor al precio mínimo';
      }
    }

    if (selectedZones.length === 0) {
      newErrors.zones = 'Debe seleccionar al menos una zona';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error específico
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Manejar selección de categorías
  const handleCategoryToggle = (categoryId) => {
    const newCategories = formData.applyToCategories.includes(categoryId)
      ? formData.applyToCategories.filter(id => id !== categoryId)
      : [...formData.applyToCategories, categoryId];
    
    handleInputChange('applyToCategories', newCategories);
  };

  // Generar vista previa del ajuste
  const generatePreview = () => {
    if (!validateForm()) return;

    const selectedZoneNames = zones.filter(z => selectedZones.includes(z.id)).map(z => z.name);
    const adjustmentMultiplier = formData.adjustmentDirection === 'increase' 
      ? 1 + (parseFloat(formData.adjustmentValue) / 100)
      : 1 - (parseFloat(formData.adjustmentValue) / 100);

    const preview = {
      zonesAffected: selectedZoneNames,
      adjustmentType: formData.adjustmentType,
      adjustmentValue: formData.adjustmentValue,
      adjustmentDirection: formData.adjustmentDirection,
      categoriesAffected: formData.applyToCategories.length > 0 
        ? priceCategories.filter(c => formData.applyToCategories.includes(c.id)).map(c => c.name)
        : ['Todas las categorías'],
      estimatedChange: formData.adjustmentType === 'percentage' 
        ? `${formData.adjustmentDirection === 'increase' ? '+' : '-'}${formData.adjustmentValue}%`
        : `${formData.adjustmentDirection === 'increase' ? '+' : '-'}$${formData.adjustmentValue}`,
      priceRange: {
        min: formData.minPrice ? `$${formData.minPrice}` : 'Sin límite',
        max: formData.maxPrice ? `$${formData.maxPrice}` : 'Sin límite'
      },
      roundingEnabled: formData.roundPrices,
      roundingPrecision: formData.roundingPrecision
    };

    setPreviewData(preview);
    setPreviewMode(true);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await applyAdjustment.mutateAsync({
        zoneIds: selectedZones,
        adjustmentType: formData.adjustmentType,
        adjustmentValue: parseFloat(formData.adjustmentValue),
        adjustmentDirection: formData.adjustmentDirection,
        categories: formData.applyToCategories,
        filters: {
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null
        },
        options: {
          roundPrices: formData.roundPrices,
          roundingPrecision: formData.roundingPrecision
        }
      });
      
      onClose();
    } catch (error) {
      console.error('Error applying price adjustment:', error);
    }
  };

  const getSelectedZonesNames = () => {
    return zones.filter(z => selectedZones.includes(z.id)).map(z => z.name).join(', ');
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Ajuste Masivo de Precios"
      submitText="Aplicar Ajuste"
      cancelText="Cancelar"
      isLoading={applyAdjustment.isLoading}
      size="xl"
      submitButtonColor="bg-orange-600 hover:bg-orange-700"
    >
      <div className="space-y-6">
        {/* Zonas Seleccionadas */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Target className="h-5 w-5 text-blue-600 mr-2" />
            Zonas Seleccionadas
          </h3>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedZones.length}</strong> zona(s) seleccionada(s): {getSelectedZonesNames()}
            </p>
          </div>
          
          {errors.zones && (
            <p className="text-sm text-red-600">{errors.zones}</p>
          )}
        </div>

        {/* Tipo y Valor de Ajuste */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Calculator className="h-5 w-5 text-green-600 mr-2" />
            Configuración del Ajuste
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de ajuste */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Ajuste
              </label>
              <select
                value={formData.adjustmentType}
                onChange={(e) => handleInputChange('adjustmentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Valor Fijo ($)</option>
              </select>
            </div>

            {/* Dirección del ajuste */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección del Ajuste
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('adjustmentDirection', 'increase')}
                  className={`flex-1 py-2 px-3 rounded-md border transition-colors ${
                    formData.adjustmentDirection === 'increase'
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 mx-auto mb-1" />
                  <span className="text-xs">Aumentar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('adjustmentDirection', 'decrease')}
                  className={`flex-1 py-2 px-3 rounded-md border transition-colors ${
                    formData.adjustmentDirection === 'decrease'
                      ? 'bg-red-100 border-red-300 text-red-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TrendingDown className="h-4 w-4 mx-auto mb-1" />
                  <span className="text-xs">Disminuir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Valor del ajuste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor del Ajuste *
            </label>
            <div className="relative">
              {formData.adjustmentType === 'percentage' ? (
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              ) : (
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
              <input
                type="number"
                value={formData.adjustmentValue}
                onChange={(e) => handleInputChange('adjustmentValue', e.target.value)}
                placeholder={formData.adjustmentType === 'percentage' ? '10' : '5.00'}
                min="0"
                step={formData.adjustmentType === 'percentage' ? '0.1' : '0.01'}
                className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.adjustmentValue ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.adjustmentValue && (
              <p className="mt-1 text-sm text-red-600">{errors.adjustmentValue}</p>
            )}
            
            <p className="mt-1 text-sm text-gray-500">
              {formData.adjustmentType === 'percentage' 
                ? 'Porcentaje a aplicar (ejemplo: 15 para 15%)'
                : 'Valor fijo a sumar o restar (ejemplo: 5.50)'
              }
            </p>
          </div>
        </div>

        {/* Filtros por Categoría */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Settings className="h-5 w-5 text-purple-600 mr-2" />
            Categorías de Precios (Opcional)
          </h3>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Si no selecciona ninguna categoría, el ajuste se aplicará a todos los precios.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {priceCategories.map(category => (
                <label key={category.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.applyToCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-2xl">{category.icon}</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{category.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Filtros de Precio */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
            Filtros de Rango de Precios (Opcional)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Mínimo
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.minPrice}
                  onChange={(e) => handleInputChange('minPrice', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Solo aplicar a precios mayores o iguales a este valor
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Máximo
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.maxPrice}
                  onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                  placeholder="1000.00"
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.maxPrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.maxPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.maxPrice}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Solo aplicar a precios menores o iguales a este valor
              </p>
            </div>
          </div>
        </div>

        {/* Opciones de Redondeo */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Calculator className="h-5 w-5 text-indigo-600 mr-2" />
            Opciones de Redondeo
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.roundPrices}
                onChange={(e) => handleInputChange('roundPrices', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-900">Redondear precios después del ajuste</span>
            </label>
            
            {formData.roundPrices && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precisión de Redondeo
                </label>
                <select
                  value={formData.roundingPrecision}
                  onChange={(e) => handleInputChange('roundingPrecision', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Entero ($12)</option>
                  <option value={1}>1 decimal ($12.3)</option>
                  <option value={2}>2 decimales ($12.34)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Vista Previa */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Vista Previa del Ajuste
            </h3>
            
            <button
              type="button"
              onClick={generatePreview}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Generar Vista Previa
            </button>
          </div>
          
          {previewMode && previewData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Zonas afectadas:</span>
                  <span className="ml-2 text-gray-900">{previewData.zonesAffected.join(', ')}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Cambio estimado:</span>
                  <span className={`ml-2 font-semibold ${
                    formData.adjustmentDirection === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {previewData.estimatedChange}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Categorías:</span>
                  <span className="ml-2 text-gray-900">{previewData.categoriesAffected.join(', ')}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Rango de precios:</span>
                  <span className="ml-2 text-gray-900">
                    {previewData.priceRange.min} - {previewData.priceRange.max}
                  </span>
                </div>
                
                {previewData.roundingEnabled && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Redondeo:</span>
                    <span className="ml-2 text-gray-900">
                      {previewData.roundingPrecision} decimales
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Esta acción afectará múltiples precios. Revise cuidadosamente antes de aplicar.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
};

export default PriceAdjustmentModal;
