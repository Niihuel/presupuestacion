/**
 * Modal para crear/editar piezas
 * 
 * Formulario completo con validación para gestión de piezas
 * incluyendo precios por zona y configuración de stock.
 */

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  X, 
  Save, 
  Package, 
  DollarSign, 
  MapPin, 
  Plus, 
  Trash2,
  AlertCircle,
  Hash,
  FileText,
  Package2,
  Loader2,
  RefreshCw
} from 'lucide-react';

import { useCreatePiece, useUpdatePiece } from '@compartido/hooks/usePiecesHook';
import { useZones } from '@compartido/hooks/useZonesHook';
import LoadingSpinner from '@compartido/components/LoadingSpinner';
import pieceService from '@compartido/services/piece.service';
import systemConfigService from '@compartido/services/systemConfig.service.js';

function PieceModal({ isOpen, onClose, piece = null, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!piece;
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [currency, setCurrency] = useState('ARS');
  const [pricePerKg, setPricePerKg] = useState(1);
  const [usdSource, setUsdSource] = useState('blue');

  // React Query hooks
  const createPieceMutation = useCreatePiece();
  const updatePieceMutation = useUpdatePiece();
  const { data: zonesData } = useZones();
  const zones = zonesData?.zones || [];

  // Familias y unidades disponibles
  const PIECE_FAMILIES = [
    { id: 1, name: 'Vigas' },
    { id: 2, name: 'Columnas' },
    { id: 3, name: 'Losas' },
    { id: 4, name: 'Placas' },
    { id: 5, name: 'Escalones' },
    { id: 6, name: 'Muros' }
  ];

  const UNITS = [
    { id: 1, name: 'Unidad' },
    { id: 2, name: 'Metro' },
    { id: 3, name: 'Metro cuadrado' },
    { id: 4, name: 'Metro cúbico' },
    { id: 5, name: 'Kilogramo' }
  ];

  const families = PIECE_FAMILIES;
  const units = UNITS;

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
      um: 'UND', // 'UND' | 'MT' | 'M2' para el motor
      categoriaAjuste: 'GENERAL', // 'GENERAL' | 'ESPECIAL'
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      volume: 0,
      pesoPorUM_tn: 0, // tn/UM cuando UM es MT/M2 (o UND si se desea explicitar)
      formula_coefficient: 1,
      global_coefficient: 2,
      prices: []
    }
  });
  const generatePieceCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await pieceService.generatePieceCode();
      if (response?.success && response.data?.code) {
        // setValue is available from useForm
        // but it's not destructured; add it above
      }
    } catch (error) {
      console.error('Error generating piece code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Cargar configuración del sistema (moneda y tarifa base por kg)
  useEffect(() => {
    (async () => {
      try {
        const resp = await systemConfigService.getSystemConfig();
        const cfg = resp?.data?.config || resp?.config || resp?.data || resp || {};
        const general = cfg.general || resp?.data?.general || {};
        const pricing = cfg.pricing || resp?.data?.pricing || {};
        setCurrency(general.currency || 'ARS');
        const cfgPpk = Number(pricing.price_per_kg ?? pricing.base_price_per_kg ?? pricing.kg_base_rate ?? 0);
        setUsdSource((pricing.usd_source || 'blue').toLowerCase());
        if (cfgPpk > 0) {
          setPricePerKg(cfgPpk);
        } else {
          // Fallback: tomar dólar de Argentina del día
          try {
            // Bluelytics: oficial/blue
            const r = await fetch('https://api.bluelytics.com.ar/v2/latest');
            const j = await r.json();
            const rate = (pricing.usd_source || 'blue').toLowerCase() === 'oficial'
              ? Number(j?.oficial?.value_avg || j?.oficial?.value_sell || 0)
              : Number(j?.blue?.value_avg || j?.blue?.value_sell || 0);
            if (rate > 0) setPricePerKg(rate);
          } catch (_) {
            try {
              // Respaldo: exchangerate.host
              const r2 = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=ARS');
              const j2 = await r2.json();
              const rate2 = Number(j2?.rates?.ARS || 0);
              if (rate2 > 0) setPricePerKg(rate2);
            } catch (_) {
              setPricePerKg(1);
            }
          }
        }
      } catch (_) {
        setCurrency('ARS');
        setPricePerKg(1);
      }
    })();
  }, []);

  // Field array para precios por zona
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prices'
  });

  // Inicializar formulario cuando se recibe una pieza para editar
  useEffect(() => {
    if (piece && isOpen) {
      const pricesData = piece.prices ? piece.prices.map(p => ({
        zoneId: p.zone_id || p.zoneId,
        price: p.price || 0
      })) : [];

      reset({
        name: piece.name || '',
        code: piece.code || '',
        description: piece.description || '',
        family_id: piece.family_id || '',
        unit_id: piece.unit_id || '',
        um: piece.um || 'UND',
        categoriaAjuste: piece.categoriaAjuste === 'ESPECIAL' ? 'ESPECIAL' : 'GENERAL',
        length: piece.length || 0,
        width: piece.width || 0,
        height: piece.height || 0,
        weight: piece.weight || 0,
        volume: piece.volume || 0,
        pesoPorUM_tn: piece.pesoPorUM_tn || 0,
        formula_coefficient: piece.formula_coefficient || 1,
        global_coefficient: piece.global_coefficient || 2,
        prices: pricesData
      });
    } else if (!piece && isOpen) {
      reset({
        name: '',
        code: '',
        description: '',
        family_id: '',
        unit_id: '',
        um: 'UND',
        categoriaAjuste: 'GENERAL',
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        volume: 0,
        pesoPorUM_tn: 0,
        formula_coefficient: 1,
        global_coefficient: 2,
        prices: []
      });
    }
  }, [piece, isOpen, reset]);

  // Utilidades de cálculo de precio por unidad (m o m² según ancho)
  const computeKgPerUnit = () => {
    const length = parseFloat(watch('length') || 0);
    const width = parseFloat(watch('width') || 0);
    const weight = parseFloat(watch('weight') || 0);
    if (length <= 0) return 0;
    if (width > 0) return weight / (length * width); // kg por m²
    return weight / length; // kg por m
  };

  const computeSuggestedUnitPrice = () => {
    const kgPerUnit = computeKgPerUnit();
    const k1 = parseFloat(watch('formula_coefficient') || 1);
    const k2 = parseFloat(watch('global_coefficient') || 1);
    const price = kgPerUnit * pricePerKg * k1 * k2;
    return Number.isFinite(price) ? Number(price.toFixed(2)) : 0;
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Derivados automáticos
      const lengthM = parseFloat(data.length) || 0;
      const widthM = parseFloat(data.width) || 0;
      const heightM = parseFloat(data.height) || 0;
      const weightKg = parseFloat(data.weight) || 0;
      const umSel = data.um || 'UND';
      const categoriaAjusteSel = data.categoriaAjuste === 'ESPECIAL' ? 'ESPECIAL' : 'GENERAL';
      const pesoPorUM_tn = parseFloat(data.pesoPorUM_tn) || 0;
      const computedVolume = (lengthM > 0 && widthM > 0 && heightM > 0)
        ? (lengthM * widthM * heightM)
        : 0;

      const pieceData = {
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        family_id: parseInt(data.family_id),
        unit_id: parseInt(data.unit_id),
        um: umSel,
        categoriaAjuste: categoriaAjusteSel,
        length: lengthM,
        width: widthM,
        height: heightM,
        weight: weightKg,
        volume: computedVolume,
        // Solo persistir pesoPorUM_tn si aplica o si se cargó
        ...(pesoPorUM_tn > 0 ? { pesoPorUM_tn } : {}),
        prices: data.prices.filter(p => p.price > 0).map(p => ({
          zoneId: parseInt(p.zoneId),
          price: parseFloat(p.price)
        }))
      };

      if (isEditing) {
        await updatePieceMutation.mutateAsync({ 
          id: piece.id, 
          data: pieceData 
        });
      } else {
        await createPieceMutation.mutateAsync(pieceData);
      }

      // Llamar onSuccess si está disponible
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error saving piece:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPriceZone = () => {
    const suggested = computeSuggestedUnitPrice();
    append({ zoneId: '', price: suggested });
  };

  // Recalcular precios sugeridos cuando cambian dimensiones/peso/coeficientes
  const lengthValue = watch('length');
  const widthValue = watch('width');
  const weightValue = watch('weight');
  const k1Value = watch('formula_coefficient');
  const k2Value = watch('global_coefficient');

  useEffect(() => {
    const suggested = computeSuggestedUnitPrice();
    fields.forEach((field, index) => {
      const zoneId = watch(`prices.${index}.zoneId`);
      if (zoneId) {
        setValue(`prices.${index}.price`, suggested, { shouldDirty: true });
      }
    });
  }, [lengthValue, widthValue, weightValue, k1Value, k2Value, pricePerKg, fields.length]);

  const removePriceZone = (index) => {
    remove(index);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Pieza' : 'Nueva Pieza'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Actualiza la información de la pieza' : 'Completa los datos de la nueva pieza'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package2 className="inline h-4 w-4 mr-1" />
                Nombre *
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'El nombre es requerido',
                  minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                })}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                Código
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  {...register('code')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej. PIEZ-2025-001"
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsGeneratingCode(true);
                      try {
                        const res = await pieceService.generatePieceCode();
                        const code = res?.data?.code || res?.code; // tolerar distintas formas
                        if (code) setValue('code', code);
                      } catch (e) {
                        console.error('Error generating piece code:', e);
                      } finally {
                        setIsGeneratingCode(false);
                      }
                    }}
                    disabled={isGeneratingCode}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                  >
                    {isGeneratingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción detallada de la pieza"
            />
          </div>

          {/* Familia y unidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Familia *
              </label>
              <select
                {...register('family_id', { 
                  required: 'La familia es requerida',
                  validate: value => value !== '' || 'Debe seleccionar una familia'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar familia</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>
                    {family.name}
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
                Unidad (catálogo)
              </label>
              <select
                {...register('unit_id', { 
                  required: 'La unidad es requerida',
                  validate: value => value !== '' || 'Debe seleccionar una unidad'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar unidad</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
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
          </div>

          {/* UM del motor + Categoría de ajuste */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UM (motor de cálculo) *</label>
              <select
                {...register('um', { required: 'La UM es requerida' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="UND">UND (Unidad)</option>
                <option value="MT">MT (Metro)</option>
                <option value="M2">M2 (Metro cuadrado)</option>
              </select>
              {errors.um && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">{errors.um.message}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría de ajuste *</label>
              <select
                {...register('categoriaAjuste', { required: 'La categoría es requerida' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="ESPECIAL">ESPECIAL</option>
              </select>
              {errors.categoriaAjuste && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">{errors.categoriaAjuste.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dimensiones (usadas por el cálculo de MedTotal/PesoTotal en presupuestación) */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Dimensiones</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Largo (m) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('length', {
                    required: 'El largo es requerido',
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.length && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">{errors.length.message}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ancho (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('width', {
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alto (m) (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('height', {
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {/* Espesor y diámetro se removieron por no ser necesarios para la fórmula */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volumen (m³) (auto)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={(parseFloat(watch('length')||0) > 0 && parseFloat(watch('width')||0) > 0 && parseFloat(watch('height')||0) > 0)
                    ? (parseFloat(watch('length')) * parseFloat(watch('width')) * parseFloat(watch('height'))).toFixed(4)
                    : (watch('volume') || 0)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso unitario (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('weight', {
                    required: 'El peso unitario es requerido',
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.weight && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">{errors.weight.message}</span>
                  </div>
                )}
              </div>

              {/* Peso por UM (tn/UM) cuando UM es MT o M2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso por UM (tn/UM) {watch('um') !== 'UND' ? '*' : ''}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  {...register('pesoPorUM_tn', {
                    validate: (val) => {
                      const um = watch('um');
                      const num = parseFloat(val);
                      if (um === 'UND') return true; // opcional para UND
                      return (num > 0) || 'Requerido para MT/M2';
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0000"
                />
                {errors.pesoPorUM_tn && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">{errors.pesoPorUM_tn.message}</span>
                  </div>
                )}
              </div>

              {/* Campo derivado: kg/m (solo lectura) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso por metro (kg/m) (auto)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={(parseFloat(watch('length')||0) > 0)
                    ? (parseFloat(watch('weight')||0) / parseFloat(watch('length')||1)).toFixed(4)
                    : 0}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Precios por zona (fuente de precios automáticos por planta en presupuestación) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">Precios por zona</h4>
              <button
                type="button"
                onClick={addPriceZone}
                className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar zona
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <select
                      {...register(`prices.${index}.zoneId`, {
                        required: 'Selecciona una zona'
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => {
                        // Persistir selección y recalcular precio sugerido
                        setValue(`prices.${index}.zoneId`, e.target.value);
                        const suggested = computeSuggestedUnitPrice();
                        setValue(`prices.${index}.price`, suggested, { shouldDirty: true });
                      }}
                    >
                      <option value="">Seleccionar zona</option>
                      {zones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        {...register(`prices.${index}.price`, {
                          min: { value: 0, message: 'No puede ser negativo' }
                        })}
                        readOnly
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePriceZone(index)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Actualizar Pieza' : 'Crear Pieza'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PieceModal;
