/**
 * Modal de Copia de Precios usando FormModal Reutilizable
 * 
 * Modal refactorizado para copiar precios entre zonas usando el sistema 
 * de modales corporativo. Permite selección de zonas origen/destino,
 * aplicación de markup y vista previa de cambios.
 */

import React, { useState, useEffect } from 'react';
import { FormModal } from '@shared/components/modals';
import { 
  Copy, 
  ArrowRight, 
  Percent, 
  DollarSign, 
  Eye,
  CheckCircle,
  AlertTriangle,
  Target,
  Package,
  TrendingUp
} from 'lucide-react';
import { 
  useZones, 
  useCopyPricesBetweenZones,
  useZonePrices 
} from '@compartido/hooks/useZonas';

const PriceCopyModal = ({ 
  isOpen, 
  onClose, 
  sourceZoneId = null 
}) => {
  const [formData, setFormData] = useState({
    sourceZoneId: sourceZoneId || '',
    targetZoneIds: [],
    applyMarkup: false,
    markupType: 'percentage', // 'percentage' | 'fixed'
    markupValue: '',
    selectedPieces: [],
    copyOnlyMissing: false,
    overwriteExisting: true
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errors, setErrors] = useState({});

  // Hooks
  const { data: zones = [] } = useZones();
  const copyPrices = useCopyPricesBetweenZones();
  const { data: zonePrices = [] } = useZonePrices(formData.sourceZoneId);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        sourceZoneId: sourceZoneId || '',
        targetZoneIds: [],
        applyMarkup: false,
        markupType: 'percentage',
        markupValue: '',
        selectedPieces: [],
        copyOnlyMissing: false,
        overwriteExisting: true
      });
      setPreviewMode(false);
      setPreviewData(null);
      setErrors({});
    }
  }, [isOpen, sourceZoneId]);

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.sourceZoneId) {
      newErrors.sourceZoneId = 'Debe seleccionar una zona origen';
    }

    if (formData.targetZoneIds.length === 0) {
      newErrors.targetZoneIds = 'Debe seleccionar al menos una zona destino';
    }

    if (formData.sourceZoneId && formData.targetZoneIds.includes(formData.sourceZoneId)) {
      newErrors.targetZoneIds = 'La zona origen no puede ser también zona destino';
    }

    if (formData.applyMarkup && (!formData.markupValue || parseFloat(formData.markupValue) === 0)) {
      newErrors.markupValue = 'Debe especificar un valor de markup válido';
    }

    if (formData.applyMarkup && formData.markupType === 'percentage') {
      const percentage = parseFloat(formData.markupValue);
      if (percentage < -50 || percentage > 200) {
        newErrors.markupValue = 'El porcentaje debe estar entre -50% y 200%';
      }
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

  // Manejar selección de zonas destino
  const handleTargetZoneToggle = (zoneId) => {
    const newTargetZones = formData.targetZoneIds.includes(zoneId)
      ? formData.targetZoneIds.filter(id => id !== zoneId)
      : [...formData.targetZoneIds, zoneId];
    
    handleInputChange('targetZoneIds', newTargetZones);
  };

  // Manejar selección de piezas
  const handlePieceToggle = (pieceId) => {
    const newSelectedPieces = formData.selectedPieces.includes(pieceId)
      ? formData.selectedPieces.filter(id => id !== pieceId)
      : [...formData.selectedPieces, pieceId];
    
    handleInputChange('selectedPieces', newSelectedPieces);
  };

  // Seleccionar/deseleccionar todas las piezas
  const handleSelectAllPieces = () => {
    const allPieceIds = zonePrices.map(price => price.pieceId);
    const allSelected = allPieceIds.every(id => formData.selectedPieces.includes(id));
    
    handleInputChange('selectedPieces', allSelected ? [] : allPieceIds);
  };

  // Generar vista previa de la copia
  const generatePreview = () => {
    if (!validateForm()) return;

    const sourceZone = zones.find(z => z.id === formData.sourceZoneId);
    const targetZones = zones.filter(z => formData.targetZoneIds.includes(z.id));
    const selectedPrices = formData.selectedPieces.length > 0 
      ? zonePrices.filter(p => formData.selectedPieces.includes(p.pieceId))
      : zonePrices;

    const baseTotal = selectedPrices.reduce((sum, price) => sum + price.amount, 0);
    let adjustedTotal = baseTotal;

    if (formData.applyMarkup) {
      const markupValue = parseFloat(formData.markupValue);
      if (formData.markupType === 'percentage') {
        adjustedTotal = baseTotal * (1 + markupValue / 100);
      } else {
        adjustedTotal = baseTotal + (markupValue * selectedPrices.length);
      }
    }

    const preview = {
      sourceZone: sourceZone?.name || '',
      targetZones: targetZones.map(z => z.name),
      piecesCount: selectedPrices.length,
      totalPieces: zonePrices.length,
      baseTotal: baseTotal,
      adjustedTotal: adjustedTotal,
      markupApplied: formData.applyMarkup,
      markupValue: formData.markupValue,
      markupType: formData.markupType,
      copyOnlyMissing: formData.copyOnlyMissing,
      overwriteExisting: formData.overwriteExisting
    };

    setPreviewData(preview);
    setPreviewMode(true);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await copyPrices.mutateAsync({
        sourceZoneId: formData.sourceZoneId,
        targetZoneIds: formData.targetZoneIds,
        pieceIds: formData.selectedPieces.length > 0 ? formData.selectedPieces : null,
        markup: formData.applyMarkup ? {
          type: formData.markupType,
          value: parseFloat(formData.markupValue)
        } : null,
        options: {
          copyOnlyMissing: formData.copyOnlyMissing,
          overwriteExisting: formData.overwriteExisting
        }
      });
      
      onClose();
    } catch (error) {
      console.error('Error copying prices:', error);
    }
  };

  const availableTargetZones = zones.filter(z => z.id !== formData.sourceZoneId);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Copiar Precios Entre Zonas"
      submitText="Copiar Precios"
      cancelText="Cancelar"
      isLoading={copyPrices.isLoading}
      size="xl"
      submitButtonColor="bg-blue-600 hover:bg-blue-700"
    >
      <div className="space-y-6">
        {/* Selección de Zonas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Target className="h-5 w-5 text-blue-600 mr-2" />
            Selección de Zonas
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zona Origen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Origen *
              </label>
              <select
                value={formData.sourceZoneId}
                onChange={(e) => handleInputChange('sourceZoneId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sourceZoneId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar zona origen...</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              {errors.sourceZoneId && (
                <p className="mt-1 text-sm text-red-600">{errors.sourceZoneId}</p>
              )}
            </div>

            {/* Zonas Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zonas Destino * ({formData.targetZoneIds.length} seleccionadas)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                {availableTargetZones.map(zone => (
                  <label key={zone.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetZoneIds.includes(zone.id)}
                      onChange={() => handleTargetZoneToggle(zone.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">{zone.name}</span>
                  </label>
                ))}
              </div>
              {errors.targetZoneIds && (
                <p className="mt-1 text-sm text-red-600">{errors.targetZoneIds}</p>
              )}
            </div>
          </div>
        </div>

        {/* Selección de Piezas */}
        {formData.sourceZoneId && zonePrices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                <Package className="h-5 w-5 text-green-600 mr-2" />
                Selección de Piezas ({formData.selectedPieces.length}/{zonePrices.length})
              </h3>
              
              <button
                type="button"
                onClick={handleSelectAllPieces}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {zonePrices.length > 0 && zonePrices.every(p => formData.selectedPieces.includes(p.pieceId))
                  ? 'Deseleccionar Todo'
                  : 'Seleccionar Todo'
                }
              </button>
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
              {zonePrices.map(price => (
                <label key={price.pieceId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedPieces.includes(price.pieceId)}
                      onChange={() => handlePieceToggle(price.pieceId)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">{price.pieceName}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">${price.amount.toFixed(2)}</span>
                </label>
              ))}
            </div>
            
            <p className="text-sm text-gray-500">
              Si no selecciona ninguna pieza específica, se copiarán todos los precios disponibles.
            </p>
          </div>
        )}

        {/* Configuración de Markup */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
            Ajuste de Precios (Opcional)
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.applyMarkup}
                onChange={(e) => handleInputChange('applyMarkup', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-900">Aplicar ajuste a los precios copiados</span>
            </label>
            
            {formData.applyMarkup && (
              <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Ajuste
                  </label>
                  <select
                    value={formData.markupType}
                    onChange={(e) => handleInputChange('markupType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Valor Fijo ($)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor del Ajuste *
                  </label>
                  <div className="relative">
                    {formData.markupType === 'percentage' ? (
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                    <input
                      type="number"
                      value={formData.markupValue}
                      onChange={(e) => handleInputChange('markupValue', e.target.value)}
                      placeholder={formData.markupType === 'percentage' ? '15' : '5.00'}
                      step={formData.markupType === 'percentage' ? '0.1' : '0.01'}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.markupValue ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.markupValue && (
                    <p className="mt-1 text-sm text-red-600">{errors.markupValue}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opciones de Copia */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Copy className="h-5 w-5 text-purple-600 mr-2" />
            Opciones de Copia
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.copyOnlyMissing}
                onChange={(e) => handleInputChange('copyOnlyMissing', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-900">Copiar solo precios faltantes</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.overwriteExisting}
                onChange={(e) => handleInputChange('overwriteExisting', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-900">Sobrescribir precios existentes</span>
            </label>
          </div>
        </div>

        {/* Vista Previa */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Eye className="h-5 w-5 text-indigo-600 mr-2" />
              Vista Previa
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
              <div className="flex items-center text-gray-800 mb-3">
                <span className="font-medium">{previewData.sourceZone}</span>
                <ArrowRight className="h-4 w-4 mx-2" />
                <span className="font-medium">{previewData.targetZones.join(', ')}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Piezas a copiar:</span>
                  <span className="ml-2 text-gray-900">
                    {previewData.piecesCount} de {previewData.totalPieces}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Valor total base:</span>
                  <span className="ml-2 text-gray-900">${previewData.baseTotal.toFixed(2)}</span>
                </div>
                
                {previewData.markupApplied && (
                  <>
                    <div>
                      <span className="font-medium text-gray-700">Ajuste aplicado:</span>
                      <span className="ml-2 text-blue-600 font-semibold">
                        {previewData.markupType === 'percentage' 
                          ? `+${previewData.markupValue}%`
                          : `+$${previewData.markupValue}`
                        }
                      </span>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Valor total ajustado:</span>
                      <span className="ml-2 text-green-600 font-semibold">
                        ${previewData.adjustedTotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  Se copiarán precios a <strong>{previewData.targetZones.length}</strong> zona(s) destino
                  {previewData.copyOnlyMissing && ' (solo faltantes)'}
                  {previewData.overwriteExisting && ' (sobrescribiendo existentes)'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
};

export default PriceCopyModal;
