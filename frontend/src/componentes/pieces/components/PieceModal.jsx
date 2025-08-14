/**
 * Modal para crear/editar piezas con BOM y cálculo de precio
 * 
 * Formulario completo con validación para gestión de piezas
 * incluyendo BOM, precios por zona y cálculo con parámetros de proceso.
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
  RefreshCw,
  Calculator,
  Layers,
  TrendingUp,
  Info
} from 'lucide-react';

import { useCreatePiece, useUpdatePiece } from '@compartido/hooks/usePiecesHook';
import { useZones } from '@compartido/hooks/useZonesHook';
import { useMaterials } from '@compartido/hooks/useMaterialsHook';
import { usePieceMaterialFormula, useUpdatePieceMaterialFormula } from '@compartido/hooks/usePieceMaterialFormula';
import LoadingSpinner from '@compartido/components/LoadingSpinner';
import pieceService from '@compartido/services/piece.service';
import materialService from '@compartido/services/material.service';
import systemConfigService from '@compartido/services/systemConfig.service.js';
import { precioBasePorUM } from '@compartido/utils/precioBasePorUM';

function PieceModal({ isOpen, onClose, piece = null, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!piece;
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [currency, setCurrency] = useState('ARS');
  const [pricePerKg, setPricePerKg] = useState(1);
  const [usdSource, setUsdSource] = useState('blue');
  const [showBOMSection, setShowBOMSection] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [processParams, setProcessParams] = useState(null);

  // React Query hooks
  const createPieceMutation = useCreatePiece();
  const updatePieceMutation = useUpdatePiece();
  const updateFormulaMutation = useUpdatePieceMaterialFormula();
  const { data: zonesData } = useZones();
  const { data: materialsData } = useMaterials();
  const { data: formulaData, refetch: refetchFormula } = usePieceMaterialFormula(piece?.id);
  
  const zones = zonesData?.zones || [];
  const materials = materialsData?.materials || [];

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
    { id: 1, name: 'Unidad', code: 'UND' },
    { id: 2, name: 'Metro', code: 'MT' },
    { id: 3, name: 'Metro cuadrado', code: 'M2' },
    { id: 4, name: 'Metro cúbico', code: 'M3' },
    { id: 5, name: 'Kilogramo', code: 'KG' }
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
      pesoPorUM_tn: 0, // tn/UM cuando UM es MT/M2
      kgAceroPorUM: 0, // kg de acero por UM
      volumenM3PorUM: 0, // m³ de hormigón por UM
      production_zone_id: '',
      formula_coefficient: 1,
      global_coefficient: 2,
      prices: [],
      bom: [] // Lista de materiales
    }
  });

  // Field array para BOM
  const { fields: bomFields, append: appendBom, remove: removeBom, update: updateBom } = useFieldArray({
    control,
    name: 'bom'
  });

  // Field array para precios por zona
  const { fields: priceFields, append: appendPrice, remove: removePrice } = useFieldArray({
    control,
    name: 'prices'
  });

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

  // Cargar configuración del sistema
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
        }
      } catch (_) {
        setCurrency('ARS');
        setPricePerKg(1);
      }
    })();
  }, []);

  // Cargar parámetros de proceso para la zona seleccionada
  const loadProcessParams = async (zoneId) => {
    if (!zoneId) return;
    try {
      const resp = await fetch(`/api/process-parameters?zone_id=${zoneId}&month_date=${new Date().toISOString().slice(0, 7)}`);
      const data = await resp.json();
      if (data?.data) {
        setProcessParams(data.data);
      }
    } catch (error) {
      console.error('Error loading process params:', error);
    }
  };

  // Inicializar formulario cuando se recibe una pieza para editar
  useEffect(() => {
    if (piece && isOpen) {
      // Cargar BOM si existe
      let bomData = [];
      if (formulaData?.materials?.length > 0) {
        bomData = formulaData.materials.map(m => ({
          materialId: m.material_id,
          materialName: m.material_name || materials.find(mat => mat.id === m.material_id)?.name || '',
          unit: m.unit || 'kg',
          quantityPerUM: m.quantity_per_unit || 0,
          scrapPercentage: (m.waste_factor || 0) * 100 // Convertir de decimal a porcentaje
        }));
      }

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
        kgAceroPorUM: piece.kgAceroPorUM || 0,
        volumenM3PorUM: piece.volumenM3PorUM || 0,
        production_zone_id: piece.production_zone_id || '',
        formula_coefficient: piece.formula_coefficient || 1,
        global_coefficient: piece.global_coefficient || 2,
        prices: pricesData,
        bom: bomData
      });
      
      setShowBOMSection(bomData.length > 0);
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
        kgAceroPorUM: 0,
        volumenM3PorUM: 0,
        production_zone_id: '',
        formula_coefficient: 1,
        global_coefficient: 2,
        prices: [],
        bom: []
      });
      setShowBOMSection(false);
    }
  }, [piece, isOpen, reset, formulaData, materials]);

  // Agregar material al BOM
  const addMaterialToBOM = () => {
    appendBom({
      materialId: '',
      materialName: '',
      unit: 'kg',
      quantityPerUM: 0,
      scrapPercentage: 0
    });
  };

  // Calcular precio por UM usando BOM y parámetros de proceso
  const calculatePricePerUM = async () => {
    const zoneId = selectedZone || watch('production_zone_id');
    if (!zoneId) {
      alert('Seleccione una zona para calcular el precio');
      return;
    }

    setIsCalculatingPrice(true);
    try {
      // Preparar datos del BOM
      const bomData = watch('bom').map(item => ({
        materialId: parseInt(item.materialId),
        unit: item.unit,
        quantityPerUM: parseFloat(item.quantityPerUM) || 0,
        scrapPercentage: parseFloat(item.scrapPercentage) || 0
      }));

      // Obtener precios de materiales para la zona
      const materialPrices = [];
      for (const item of bomData) {
        try {
          const priceResp = await materialService.getVigenteMaterialPrices(zoneId);
          const price = priceResp?.data?.find(p => p.material_id === item.materialId);
          if (price) {
            materialPrices.push({
              materialId: item.materialId,
              price: price.price
            });
          }
        } catch (error) {
          console.error('Error fetching material price:', error);
        }
      }

      // Cargar parámetros de proceso si no están cargados
      if (!processParams) {
        await loadProcessParams(zoneId);
      }

      // Datos técnicos de la pieza
      const techData = {
        um: watch('um'),
        pesoTnPorUM: parseFloat(watch('pesoPorUM_tn')) || 0,
        kgAceroPorUM: parseFloat(watch('kgAceroPorUM')) || 0,
        volumenM3PorUM: parseFloat(watch('volumenM3PorUM')) || 0
      };

      // Calcular precio usando la función utilitaria
      if (processParams && materialPrices.length > 0) {
        const result = precioBasePorUM(
          bomData,
          materialPrices,
          processParams,
          techData,
          { allowFallback: true }
        );

        setPriceBreakdown(result);
        
        // Actualizar precios sugeridos en todas las zonas
        priceFields.forEach((field, index) => {
          setValue(`prices.${index}.price`, result.total);
        });
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      alert('Error al calcular el precio. Verifique los datos del BOM y parámetros.');
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  // Guardar pieza y BOM
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
        pesoPorUM_tn: pesoPorUM_tn,
        kgAceroPorUM: parseFloat(data.kgAceroPorUM) || 0,
        volumenM3PorUM: parseFloat(data.volumenM3PorUM) || 0,
        production_zone_id: parseInt(data.production_zone_id) || null,
        prices: data.prices.filter(p => p.price > 0).map(p => ({
          zoneId: parseInt(p.zoneId),
          price: parseFloat(p.price)
        }))
      };

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
          material_id: parseInt(item.materialId),
          quantity_per_unit: parseFloat(item.quantityPerUM) || 0,
          waste_factor: (parseFloat(item.scrapPercentage) || 0) / 100 // Convertir porcentaje a decimal
        }));

        await updateFormulaMutation.mutateAsync({
          pieceId: pieceId,
          materials: bomFormula
        });
      }

      // Llamar onSuccess si está disponible
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error saving piece:', error);
      alert('Error al guardar la pieza. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPriceZone = () => {
    appendPrice({ zoneId: '', price: priceBreakdown?.total || 0 });
  };

  const removePriceZone = (index) => {
    removePrice(index);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setPriceBreakdown(null);
      setShowBOMSection(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                {isEditing ? 'Actualiza la información y BOM de la pieza' : 'Completa los datos y lista de materiales'}
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
                    onClick={generatePieceCode}
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

          {/* Familia, unidad y zona de producción */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Zona de Producción
              </label>
              <select
                {...register('production_zone_id')}
                onChange={(e) => {
                  setValue('production_zone_id', e.target.value);
                  loadProcessParams(e.target.value);
                  setSelectedZone(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar zona</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
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
                <option value="ESPECIAL">ESPECIAL (Entrepiso/Placa/Pretensado)</option>
              </select>
              {errors.categoriaAjuste && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">{errors.categoriaAjuste.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dimensiones y pesos */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Dimensiones y Pesos</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Largo (m) {watch('um') !== 'UND' ? '*' : ''}
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('length', {
                    validate: (val) => {
                      const um = watch('um');
                      if (um === 'UND') return true;
                      return (parseFloat(val) > 0) || 'Requerido para MT/M2';
                    },
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
                  Ancho (m) {watch('um') === 'M2' ? '*' : ''}
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('width', {
                    validate: (val) => {
                      const um = watch('um');
                      if (um !== 'M2') return true;
                      return (parseFloat(val) > 0) || 'Requerido para M2';
                    },
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.width && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">{errors.width.message}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alto (m)
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

              {/* Datos técnicos para cálculo de mano de obra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  kg Acero/UM
                  <Info className="inline h-3 w-3 ml-1 text-gray-400" />
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('kgAceroPorUM', {
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  m³ Hormigón/UM
                  <Info className="inline h-3 w-3 ml-1 text-gray-400" />
                </label>
                <input
                  type="number"
                  step="0.0001"
                  {...register('volumenM3PorUM', {
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0000"
                />
              </div>
            </div>
          </div>

          {/* BOM - Lista de Materiales */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-gray-600" />
                <h4 className="text-md font-medium text-gray-900">Lista de Materiales (BOM)</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowBOMSection(!showBOMSection)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showBOMSection ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {showBOMSection && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addMaterialToBOM}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar Material
                  </button>
                </div>

                {bomFields.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No hay materiales en el BOM</p>
                    <button
                      type="button"
                      onClick={addMaterialToBOM}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Agregar primer material
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bomFields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Material
                            </label>
                            <select
                              {...register(`bom.${index}.materialId`, {
                                required: 'Seleccione un material'
                              })}
                              onChange={(e) => {
                                const material = materials.find(m => m.id === parseInt(e.target.value));
                                if (material) {
                                  setValue(`bom.${index}.materialName`, material.name);
                                  setValue(`bom.${index}.unit`, material.unit || 'kg');
                                }
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Seleccionar</option>
                              {materials.map(material => (
                                <option key={material.id} value={material.id}>
                                  {material.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Unidad
                            </label>
                            <input
                              type="text"
                              {...register(`bom.${index}.unit`)}
                              readOnly
                              className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md bg-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Cantidad/UM
                            </label>
                            <input
                              type="number"
                              step="0.0001"
                              {...register(`bom.${index}.quantityPerUM`, {
                                required: 'Requerido',
                                min: { value: 0, message: 'No negativo' }
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.0000"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Desperdicio %
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              {...register(`bom.${index}.scrapPercentage`, {
                                min: { value: 0, message: 'No negativo' },
                                max: { value: 100, message: 'Max 100%' }
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.0"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeBom(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón para calcular precio */}
                {bomFields.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <button
                      type="button"
                      onClick={calculatePricePerUM}
                      disabled={isCalculatingPrice || !watch('production_zone_id')}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCalculatingPrice ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Calculando...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 mr-2" />
                          Calcular Precio por UM
                        </>
                      )}
                    </button>
                    
                    {!watch('production_zone_id') && (
                      <span className="text-sm text-amber-600">
                        <AlertCircle className="inline h-4 w-4 mr-1" />
                        Seleccione zona de producción para calcular
                      </span>
                    )}
                  </div>
                )}

                {/* Desglose del precio calculado */}
                {priceBreakdown && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-900 mb-3">Desglose del Precio por UM</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Materiales:</span>
                        <span className="font-medium">${priceBreakdown.materiales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Proceso por Tn:</span>
                        <span className="font-medium">${priceBreakdown.proceso.porTn.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MO Hormigón:</span>
                        <span className="font-medium">${priceBreakdown.proceso.manoObraHormigon.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MO Acero:</span>
                        <span className="font-medium">${priceBreakdown.proceso.manoObraAcero.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="font-medium text-blue-900">Total:</span>
                        <span className="font-bold text-blue-900">${priceBreakdown.total.toFixed(2)}</span>
                      </div>
                      {priceBreakdown.estimado && (
                        <div className="mt-2 text-xs text-amber-600">
                          <AlertCircle className="inline h-3 w-3 mr-1" />
                          Precio estimado (algunos materiales sin precio)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Precios por zona */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">Precios por Zona</h4>
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
              {priceFields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <select
                      {...register(`prices.${index}.zoneId`, {
                        required: 'Selecciona una zona'
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {priceFields.length > 0 && (
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
