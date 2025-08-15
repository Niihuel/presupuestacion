/**
 * Modal para gestión completa de piezas con BOM, cálculo y publicación de precios
 * 
 * Integra todas las funcionalidades del backend v2:
 * - Datos técnicos completos por UM
 * - Cálculo con desglose (materiales, proceso, MO)
 * - Publicación de precios versionados
 * - Histórico con comparación mes anterior
 * - Validaciones inteligentes según UM
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  X, Save, Package, DollarSign, MapPin, Plus, Trash2, AlertCircle,
  Hash, FileText, Package2, Loader2, RefreshCw, Calculator, Layers,
  TrendingUp, TrendingDown, Info, Eye, Upload, History, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Zap, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import usePiezas from '@compartido/hooks/usePiezas';
import useZonas from '@compartido/hooks/useZonas';
import useMateriales from '@compartido/hooks/useMateriales';
import { useFormulaMaterialPieza as usePieceMaterialFormula } from '@compartido/hooks';
import LoadingSpinner from '@compartido/componentes/CargandoSpinner.jsx';
import { pieceService } from '@compartido/servicios';

const PIECE_FAMILIES = [
  { id: 1, name: 'Vigas', code: 'VIG' },
  { id: 2, name: 'Columnas', code: 'COL' },
  { id: 3, name: 'Losas', code: 'LOS' },
  { id: 4, name: 'Placas', code: 'PLA' },
  { id: 5, name: 'Escalones', code: 'ESC' },
  { id: 6, name: 'Muros', code: 'MUR' }
];

const UNITS = [
  { id: 1, name: 'Unidad', code: 'UND', requiresDimensions: false },
  { id: 2, name: 'Metro', code: 'MT', requiresDimensions: 'length' },
  { id: 3, name: 'Metro cuadrado', code: 'M2', requiresDimensions: 'area' },
  { id: 4, name: 'Metro cúbico', code: 'M3', requiresDimensions: 'volume' }
];

const ADJUSTMENT_CATEGORIES = [
  { value: 'GENERAL', label: 'General', description: 'Ajuste estándar' },
  { value: 'ESPECIAL', label: 'Especial', description: 'Ajuste personalizado' },
  { value: 'PREMIUM', label: 'Premium', description: 'Ajuste premium' }
];

function PieceModalComplete({ isOpen, onClose, piece = null, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showBOMSection, setShowBOMSection] = useState(false);
  const [showPriceSection, setShowPriceSection] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  
  // Estados para cálculo y publicación
  const [selectedCalculationZone, setSelectedCalculationZone] = useState(null);
  const [calculationDate, setCalculationDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [priceCalculation, setPriceCalculation] = useState(null);
  const [publishStatus, setPublishStatus] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isEditing = !!piece;

  // React Query hooks
  const createPieceMutation = useCreatePiece();
  const updatePieceMutation = useUpdatePiece();
  const updateFormulaMutation = useUpdatePieceMaterialFormula();
  const { data: zonesData } = useZones();
  const { data: materialsData } = useMaterials();
  const { data: formulaData } = usePieceMaterialFormula(piece?.id);
  
  const zones = zonesData?.zones || [];
  const materials = materialsData?.materials || [];

  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      family_id: '',
      unit_id: '',
      production_zone_id: '',
      categoria_ajuste: 'GENERAL',
      
      // Dimensiones físicas
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      
      // Datos técnicos para cálculo
      peso_tn_por_um: 0,
      kg_acero_por_um: 0,
      volumen_m3_por_um: 0,
      
      // Coeficientes
      formula_coefficient: 1,
      global_coefficient: 2,
      
      // BOM
      bom: [],
      
      // Precios por zona (para publicación inicial)
      initialPrices: []
    }
  });

  // Field arrays
  const { fields: bomFields, append: appendBom, remove: removeBom } = useFieldArray({
    control,
    name: 'bom'
  });

  // Watchers
  const selectedUnit = watch('unit_id');
  const selectedFamily = watch('family_id');
  const selectedProductionZone = watch('production_zone_id');
  const unitData = UNITS.find(u => u.id === parseInt(selectedUnit));

  // Cargar datos de pieza existente
  useEffect(() => {
    if (piece && isOpen) {
      // Preparar datos del BOM
      const bomData = [];
      if (piece.bom && Array.isArray(piece.bom)) {
        piece.bom.forEach(item => {
          bomData.push({
            material_id: item.material_id,
            material_name: item.material_name || '',
            unit: item.unit || 'kg',
            quantity_per_unit: item.quantity_per_unit || 0,
            waste_factor: (item.waste_factor || 0) * 100 // Convertir a porcentaje
          });
        });
      } else if (formulaData?.materials) {
        formulaData.materials.forEach(item => {
          const material = materials.find(m => m.id === item.material_id);
          bomData.push({
            material_id: item.material_id,
            material_name: material?.name || '',
            unit: material?.unit || 'kg',
            quantity_per_unit: item.quantity_per_unit || 0,
            waste_factor: (item.waste_factor || 0) * 100
          });
        });
      }

      reset({
        name: piece.name || '',
        code: piece.code || '',
        description: piece.description || '',
        family_id: piece.family_id || '',
        unit_id: piece.unit_id || '',
        production_zone_id: piece.production_zone_id || '',
        categoria_ajuste: piece.categoria_ajuste || 'GENERAL',
        length: piece.length || 0,
        width: piece.width || 0,
        height: piece.height || 0,
        weight: piece.weight || 0,
        peso_tn_por_um: piece.peso_tn_por_um || 0,
        kg_acero_por_um: piece.kg_acero_por_um || 0,
        volumen_m3_por_um: piece.volumen_m3_por_um || 0,
        formula_coefficient: piece.formula_coefficient || 1,
        global_coefficient: piece.global_coefficient || 2,
        bom: bomData,
        initialPrices: []
      });
      
      setShowBOMSection(bomData.length > 0);
      
      // Cargar histórico si está editando
      if (piece.id) {
        loadPriceHistory(piece.id);
      }
    }
  }, [piece, isOpen, reset, formulaData, materials]);

  // Generar código de pieza
  const generatePieceCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await pieceService.generatePieceCode();
      if (response?.success && response.data?.code) {
        setValue('code', response.data.code);
      }
    } catch (error) {
      console.error('Error generating piece code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Cargar histórico de precios
  const loadPriceHistory = async (pieceId) => {
    setLoadingHistory(true);
    try {
      const response = await pieceService.getPieceHistory(pieceId);
      if (response?.success && response.data) {
        setPriceHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Calcular precio usando nuevo endpoint
  const calculatePrice = async () => {
    if (!selectedCalculationZone) {
      alert('Seleccione una zona para calcular el precio');
      return;
    }

    setIsCalculatingPrice(true);
    setPriceCalculation(null);
    setPublishStatus(null);

    try {
      // Si es nueva pieza, primero guardarla
      let pieceId = piece?.id;
      if (!pieceId) {
        const formData = watch();
        const savedPiece = await savePieceTemporary(formData);
        if (!savedPiece?.id) {
          throw new Error('Debe guardar la pieza antes de calcular el precio');
        }
        pieceId = savedPiece.id;
      }

      // Llamar al nuevo endpoint de cálculo
      const response = await pieceService.calculatePiecePrice(
        pieceId,
        selectedCalculationZone,
        calculationDate,
        true // compare=true para obtener comparación
      );

      if (response?.success && response.data) {
        setPriceCalculation(response.data);
        
        // Si hay warnings, mostrarlos
        if (response.data.warnings?.length > 0) {
          console.warn('Warnings en cálculo:', response.data.warnings);
        }
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      alert(error.message || 'Error al calcular el precio');
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  // Publicar precio
  const publishPrice = async () => {
    if (!priceCalculation) {
      alert('Primero debe calcular el precio');
      return;
    }

    if (priceCalculation.missing_prices?.length > 0) {
      alert('No se puede publicar: faltan precios de materiales');
      return;
    }

    setIsSubmitting(true);
    setPublishStatus(null);

    try {
      const pieceId = piece?.id || priceCalculation.piece_id;
      
      const response = await pieceService.publishPiecePrice(pieceId, {
        zone_id: selectedCalculationZone,
        effective_date: calculationDate,
        price: priceCalculation.breakdown.total
      });

      if (response?.success) {
        setPublishStatus({
          success: true,
          message: 'Precio publicado exitosamente',
          price_id: response.data?.price_id
        });
        
        // Recargar histórico
        if (pieceId) {
          loadPriceHistory(pieceId);
        }
      }
    } catch (error) {
      console.error('Error publishing price:', error);
      setPublishStatus({
        success: false,
        message: error.message || 'Error al publicar el precio'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guardar pieza temporalmente para cálculo
  const savePieceTemporary = async (data) => {
    const pieceData = preparePieceData(data);
    const result = await createPieceMutation.mutateAsync(pieceData);
    return result.data || result;
  };

  // Preparar datos de pieza para envío
  const preparePieceData = (data) => {
    const unitData = UNITS.find(u => u.id === parseInt(data.unit_id));
    
    return {
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      family_id: parseInt(data.family_id),
      unit_id: parseInt(data.unit_id),
      production_zone_id: parseInt(data.production_zone_id) || null,
      categoria_ajuste: data.categoria_ajuste,
      length: parseFloat(data.length) || 0,
      width: parseFloat(data.width) || 0,
      height: parseFloat(data.height) || 0,
      weight: parseFloat(data.weight) || 0,
      peso_tn_por_um: parseFloat(data.peso_tn_por_um) || 0,
      kg_acero_por_um: parseFloat(data.kg_acero_por_um) || 0,
      volumen_m3_por_um: parseFloat(data.volumen_m3_por_um) || 0,
      formula_coefficient: parseFloat(data.formula_coefficient) || 1,
      global_coefficient: parseFloat(data.global_coefficient) || 2
    };
  };

  // Agregar material al BOM
  const addMaterialToBOM = () => {
    appendBom({
      material_id: '',
      material_name: '',
      unit: 'kg',
      quantity_per_unit: 0,
      waste_factor: 0
    });
  };

  // Guardar pieza y BOM
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const pieceData = preparePieceData(data);
      let pieceId = piece?.id;
      
      if (isEditing) {
        await updatePieceMutation.mutateAsync({ 
          id: piece.id, 
          data: pieceData 
        });
      } else {
        const result = await createPieceMutation.mutateAsync(pieceData);
        pieceId = result.data?.id || result.id;
      }

      // Guardar BOM si hay materiales
      if (data.bom && data.bom.length > 0 && pieceId) {
        const bomFormula = data.bom.map(item => ({
          material_id: parseInt(item.material_id),
          quantity_per_unit: parseFloat(item.quantity_per_unit) || 0,
          waste_factor: (parseFloat(item.waste_factor) || 0) / 100
        }));

        await updateFormulaMutation.mutateAsync({
          pieceId: pieceId,
          materials: bomFormula
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving piece:', error);
      alert(error.message || 'Error al guardar la pieza');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Editar Pieza' : 'Nueva Pieza'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Información básica */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      {...register('code')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="PIEZ-2024-001"
                    />
                    <button
                      type="button"
                      onClick={generatePieceCode}
                      disabled={isGeneratingCode}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingCode ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Hash className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'El nombre es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de la pieza"
                  />
                  {errors.name && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">{errors.name.message}</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción detallada..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Familia *
                  </label>
                  <select
                    {...register('family_id', { required: 'Seleccione una familia' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {PIECE_FAMILIES.map(family => (
                      <option key={family.id} value={family.id}>
                        {family.name} ({family.code})
                      </option>
                    ))}
                  </select>
                  {errors.family_id && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">{errors.family_id.message}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de Medida *
                  </label>
                  <select
                    {...register('unit_id', { required: 'Seleccione una unidad' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {UNITS.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.code})
                      </option>
                    ))}
                  </select>
                  {errors.unit_id && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">{errors.unit_id.message}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona de Producción *
                  </label>
                  <select
                    {...register('production_zone_id', { required: 'Seleccione una zona' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                  {errors.production_zone_id && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">{errors.production_zone_id.message}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría de Ajuste
                  </label>
                  <select
                    {...register('categoria_ajuste')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ADJUSTMENT_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label} - {cat.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dimensiones y datos técnicos */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Package2 className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Dimensiones y Datos Técnicos</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Dimensiones físicas */}
                {unitData?.requiresDimensions && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Largo (m) {unitData.requiresDimensions === 'length' && '*'}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        {...register('length', {
                          required: unitData.requiresDimensions === 'length' ? 'Requerido para MT' : false,
                          min: { value: 0, message: 'No puede ser negativo' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.000"
                      />
                      {errors.length && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-500">{errors.length.message}</span>
                        </div>
                      )}
                    </div>

                    {(unitData.requiresDimensions === 'area' || unitData.requiresDimensions === 'volume') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ancho (m) *
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          {...register('width', {
                            required: 'Requerido para M2/M3',
                            min: { value: 0, message: 'No puede ser negativo' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.000"
                        />
                        {errors.width && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500">{errors.width.message}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {unitData.requiresDimensions === 'volume' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alto (m) *
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          {...register('height', {
                            required: 'Requerido para M3',
                            min: { value: 0, message: 'No puede ser negativo' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.000"
                        />
                        {errors.height && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500">{errors.height.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso unitario (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('weight', {
                      min: { value: 0, message: 'No puede ser negativo' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Datos técnicos para cálculo */}
                <div className="md:col-span-3">
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Datos técnicos para cálculo de costos</p>
                        <p className="text-xs">Estos valores son necesarios para el cálculo de proceso y mano de obra.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Peso por UM (tn/UM)
                        <span className="text-xs text-gray-500 ml-1">Para proceso</span>
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        {...register('peso_tn_por_um', {
                          min: { value: 0, message: 'No puede ser negativo' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        kg Acero/UM
                        <span className="text-xs text-gray-500 ml-1">Para MO acero</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('kg_acero_por_um', {
                          min: { value: 0, message: 'No puede ser negativo' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        m³ Hormigón/UM
                        <span className="text-xs text-gray-500 ml-1">Para MO hormigón</span>
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        {...register('volumen_m3_por_um', {
                          min: { value: 0, message: 'No puede ser negativo' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOM - Lista de Materiales */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Lista de Materiales (BOM)</h3>
                  <span className="text-xs text-gray-500">({bomFields.length} materiales)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBOMSection(!showBOMSection)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showBOMSection ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Mostrar
                    </>
                  )}
                </button>
              </div>

              {showBOMSection && (
                <div className="space-y-4">
                  {bomFields.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Layers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No hay materiales en el BOM</p>
                      <button
                        type="button"
                        onClick={addMaterialToBOM}
                        className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Material
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad/UM</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Desperdicio %</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Consumo Efectivo</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {bomFields.map((field, index) => {
                              const quantity = parseFloat(watch(`bom.${index}.quantity_per_unit`)) || 0;
                              const waste = parseFloat(watch(`bom.${index}.waste_factor`)) || 0;
                              const effectiveConsumption = quantity * (1 + waste / 100);
                              
                              return (
                                <tr key={field.id}>
                                  <td className="px-3 py-2">
                                    <select
                                      {...register(`bom.${index}.material_id`, {
                                        required: 'Seleccione un material'
                                      })}
                                      onChange={(e) => {
                                        const material = materials.find(m => m.id === parseInt(e.target.value));
                                        if (material) {
                                          setValue(`bom.${index}.material_name`, material.name);
                                          setValue(`bom.${index}.unit`, material.unit || 'kg');
                                        }
                                      }}
                                      className="w-full min-w-[200px] px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="">Seleccionar...</option>
                                      {materials.map(material => (
                                        <option key={material.id} value={material.id}>
                                          {material.name} ({material.code})
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      {...register(`bom.${index}.unit`)}
                                      readOnly
                                      className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-md bg-gray-100"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="0.0001"
                                      {...register(`bom.${index}.quantity_per_unit`, {
                                        required: 'Requerido',
                                        min: { value: 0.0001, message: 'Debe ser mayor a 0' }
                                      })}
                                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="0.0000"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="0.1"
                                      {...register(`bom.${index}.waste_factor`, {
                                        min: { value: 0, message: 'No negativo' },
                                        max: { value: 100, message: 'Máximo 100%' }
                                      })}
                                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="0.0"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {effectiveConsumption.toFixed(4)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeBom(index)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={addMaterialToBOM}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar Material
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cálculo y Publicación de Precios */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Cálculo y Publicación de Precios</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPriceSection(!showPriceSection)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showPriceSection ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Mostrar
                    </>
                  )}
                </button>
              </div>

              {showPriceSection && (
                <div className="space-y-4">
                  {/* Controles de cálculo */}
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zona para cálculo
                      </label>
                      <select
                        value={selectedCalculationZone || ''}
                        onChange={(e) => setSelectedCalculationZone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar zona...</option>
                        {zones.map(zone => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha efectiva
                      </label>
                      <input
                        type="date"
                        value={calculationDate}
                        onChange={(e) => setCalculationDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={calculatePrice}
                      disabled={isCalculatingPrice || !selectedCalculationZone}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isCalculatingPrice ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Calculator className="h-4 w-4" />
                      )}
                      Calcular Precio
                    </button>
                  </div>

                  {/* Resultado del cálculo */}
                  {priceCalculation && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      {/* Warnings */}
                      {priceCalculation.warnings?.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800 mb-1">Advertencias</p>
                              <ul className="text-xs text-yellow-700 space-y-1">
                                {priceCalculation.warnings.map((warning, idx) => (
                                  <li key={idx}>• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Missing prices */}
                      {priceCalculation.missing_prices?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800 mb-1">Precios faltantes</p>
                              <ul className="text-xs text-red-700 space-y-1">
                                {priceCalculation.missing_prices.map((item, idx) => (
                                  <li key={idx}>• {item.name} ({item.code})</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Desglose de costos */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Desglose de Costos</h4>
                        <div className="bg-white rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-600">Materiales:</span>
                            <span className="text-sm font-medium">
                              ${priceCalculation.breakdown.materiales.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-600">Proceso por tn:</span>
                            <span className="text-sm font-medium">
                              ${priceCalculation.breakdown.proceso_por_tn.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-600">MO Hormigón:</span>
                            <span className="text-sm font-medium">
                              ${priceCalculation.breakdown.mano_obra_hormigon.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-600">MO Acero:</span>
                            <span className="text-sm font-medium">
                              ${priceCalculation.breakdown.mano_obra_acero.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-base font-semibold text-gray-800">Total por UM:</span>
                              <span className="text-lg font-bold text-blue-600">
                                ${priceCalculation.breakdown.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comparación con mes anterior */}
                      {priceCalculation.comparison && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Comparación con Mes Anterior</h4>
                          <div className="bg-white rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500">Precio anterior</p>
                                <p className="text-sm font-medium">
                                  ${priceCalculation.comparison.previous_price.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-center">
                                {priceCalculation.comparison.trend === 'up' ? (
                                  <TrendingUp className="h-8 w-8 text-red-500 mx-auto" />
                                ) : priceCalculation.comparison.trend === 'down' ? (
                                  <TrendingDown className="h-8 w-8 text-green-500 mx-auto" />
                                ) : (
                                  <div className="h-8 w-8 flex items-center justify-center mx-auto">
                                    <span className="text-gray-400">=</span>
                                  </div>
                                )}
                                <p className={`text-sm font-medium ${
                                  priceCalculation.comparison.trend === 'up' ? 'text-red-600' :
                                  priceCalculation.comparison.trend === 'down' ? 'text-green-600' :
                                  'text-gray-600'
                                }`}>
                                  {priceCalculation.comparison.delta > 0 ? '+' : ''}
                                  {priceCalculation.comparison.delta_percent.toFixed(2)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Precio actual</p>
                                <p className="text-sm font-medium">
                                  ${priceCalculation.comparison.current_price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botón publicar */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={publishPrice}
                          disabled={isSubmitting || priceCalculation.missing_prices?.length > 0}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Publicar Precio
                        </button>
                      </div>

                      {/* Estado de publicación */}
                      {publishStatus && (
                        <div className={`rounded-lg p-3 ${
                          publishStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            {publishStatus.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <p className={`text-sm ${
                              publishStatus.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {publishStatus.message}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Histórico de Precios */}
            {isEditing && (
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Histórico de Precios</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistorySection(!showHistorySection)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showHistorySection ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Mostrar
                      </>
                    )}
                  </button>
                </div>

                {showHistorySection && (
                  <div>
                    {loadingHistory ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : priceHistory.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No hay histórico de precios</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zona</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio/UM</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Variación</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Creado por</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {priceHistory.map((record) => (
                              <tr key={record.id}>
                                <td className="px-3 py-2 text-sm">
                                  {format(new Date(record.effective_date), 'dd/MM/yyyy', { locale: es })}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {record.zone_name}
                                </td>
                                <td className="px-3 py-2 text-sm text-right font-medium">
                                  ${record.price_per_unit.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-right">
                                  {record.delta_percent !== undefined && (
                                    <span className={`inline-flex items-center gap-1 ${
                                      record.trend === 'up' ? 'text-red-600' :
                                      record.trend === 'down' ? 'text-green-600' :
                                      'text-gray-600'
                                    }`}>
                                      {record.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                                      {record.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                                      {record.delta_percent > 0 ? '+' : ''}
                                      {record.delta_percent.toFixed(2)}%
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  {record.created_by_name || 'Sistema'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isValid}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? 'Actualizar' : 'Crear'} Pieza
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PieceModalComplete;