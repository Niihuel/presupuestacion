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
  Package2
} from 'lucide-react';

import { useCreatePiece, useUpdatePiece } from '@shared/hooks/usePiecesHook';
import { useZones } from '@shared/hooks/useZonesHook';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

function PieceModal({ isOpen, onClose, piece = null, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!piece;

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
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      family_id: '',
      unit_id: '',
      length: 0,
      width: 0,
      height: 0,
      thickness: 0,
      diameter: 0,
      volume: 0,
      prices: []
    }
  });

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
        length: piece.length || 0,
        width: piece.width || 0,
        height: piece.height || 0,
        thickness: piece.thickness || 0,
        diameter: piece.diameter || 0,
        volume: piece.volume || 0,
        prices: pricesData
      });
    } else if (!piece && isOpen) {
      reset({
        name: '',
        code: '',
        description: '',
        family_id: '',
        unit_id: '',
        length: 0,
        width: 0,
        height: 0,
        thickness: 0,
        diameter: 0,
        volume: 0,
        prices: []
      });
    }
  }, [piece, isOpen, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const pieceData = {
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        family_id: parseInt(data.family_id),
        unit_id: parseInt(data.unit_id),
        length: parseFloat(data.length) || 0,
        width: parseFloat(data.width) || 0,
        height: parseFloat(data.height) || 0,
        thickness: parseFloat(data.thickness) || 0,
        diameter: parseFloat(data.diameter) || 0,
        volume: parseFloat(data.volume) || 0,
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
    append({ zoneId: '', price: 0 });
  };

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
              <input
                type="text"
                {...register('code')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej. PIEZ-2025-001"
              />
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
                Unidad de medida *
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

          {/* Dimensiones */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Dimensiones</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Largo (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('length')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ancho (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('width')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alto (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('height')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Espesor (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('thickness')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diámetro (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('diameter')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volumen (m³)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('volume')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Precios por zona */}
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
