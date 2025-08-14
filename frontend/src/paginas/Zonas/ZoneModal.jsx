/**
 * Modal para crear/editar zonas
 * 
 * Modal principal para la gestión de zonas con:
 * - Información básica de la zona
 * - Configuración geográfica con iframe de Google Maps
 * - Estado y activación
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, 
  MapPin, 
  Save, 
  Loader2, 
  Building2, 
  Globe,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

const ZONE_TYPES = [
  'Planta Principal',
  'Planta Secundaria', 
  'Depósito',
  'Oficinas',
  'Punto de Venta'
];

const ZoneModal = ({ isOpen, onClose, onSave, zone = null, mode = 'create' }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      zone_type: '',
      region: '',
      address: '',
      city: '',
      state: '',
      country: 'Argentina',
      location_iframe: '',
      is_active: true
    }
  });

  const watchedLocationIframe = watch('location_iframe');

  // Actualizar formulario cuando cambie la zona
  useEffect(() => {
    if (zone && isOpen) {
      reset({
        name: zone.name || '',
        code: zone.code || '',
        description: zone.description || '',
        zone_type: zone.zone_type || '',
        region: zone.region || '',
        address: zone.address || '',
        city: zone.city || '',
        state: zone.state || '',
        country: zone.country || 'Argentina',
        location_iframe: zone.location_iframe || '',
        is_active: zone.is_active !== undefined ? zone.is_active : true
      });
    } else if (!zone && isOpen) {
      reset({
        name: '',
        code: '',
        description: '',
        zone_type: '',
        region: '',
        address: '',
        city: '',
        state: '',
        country: 'Argentina',
        location_iframe: '',
        is_active: true
      });
    }
  }, [zone, isOpen, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Debug: ver qué data está llegando
      console.log('Form data received:', data);
      
      // Mapear los campos del frontend al formato del backend
      const zoneData = {
        name: data.name?.trim(),
        description: data.description || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zone_type: data.zone_type || null,
        is_active: data.is_active,
        location_iframe: data.location_iframe || null
      };

      // Si estamos creando, incluir el código
      if (!isEditing && data.code) {
        zoneData.code = data.code;
      }

      console.log('Zone data to send:', zoneData);

      await onSave(zoneData);
      onClose();
    } catch (error) {
      console.error('Error saving zone:', error);
    } finally {
      setIsSubmitting(false);
    }
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
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Zona' : 'Nueva Zona'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modifica los datos de la zona' : 'Crea una nueva zona geográfica'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
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
                <Building2 className="inline h-4 w-4 mr-1" />
                Nombre de la Zona *
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'El nombre es requerido',
                  minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ej: Zona Norte, Región Metropolitana..."
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
                Código
              </label>
              <input
                type="text"
                {...register('code')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Código único (opcional)"
              />
            </div>
          </div>

          {/* Tipo y región */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Zona *
              </label>
              <select
                {...register('zone_type', { 
                  required: 'El tipo de zona es requerido' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Seleccionar tipo</option>
                {ZONE_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.zone_type && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">{errors.zone_type.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Región (opcional)
              </label>
              <input
                type="text"
                {...register('region')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ej: Metropolitana, Valparaíso..."
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Dirección Completa
              </label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ej: Av. Libertador 1234, Buenos Aires, Argentina"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                {...register('city')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ej: Santiago, Valparaíso..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado/Provincia
              </label>
              <input
                type="text"
                {...register('state')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Estado o provincia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <input
                type="text"
                {...register('country')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="País"
              />
            </div>
            </div>
          </div>

          {/* Google Maps iframe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="inline h-4 w-4 mr-1" />
              Ubicación en Google Maps (opcional)
            </label>
            <div className="space-y-3">
              <textarea
                {...register('location_iframe')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Pega aquí el código iframe de Google Maps para mostrar la ubicación..."
              />
              
              {/* Instrucciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <ExternalLink className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">¿Cómo obtener el iframe de Google Maps?</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-600">
                      <li>Ve a Google Maps y busca la ubicación</li>
                      <li>Haz clic en "Compartir" → "Insertar un mapa"</li>
                      <li>Copia el código iframe completo</li>
                      <li>Pégalo en el campo de arriba</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Vista previa del iframe */}
              {watchedLocationIframe && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Vista previa de ubicación:</span>
                  </div>
                  <div className="w-full h-64 flex items-center justify-center">
                    <div 
                      className="w-full h-full"
                      style={{ 
                        minHeight: '250px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: watchedLocationIframe.replace(
                          /width="\d+"/g, 'width="100%"'
                        ).replace(
                          /height="\d+"/g, 'height="250"'
                        ).replace(
                          /style="[^"]*"/g, 'style="border:0; width:100%; height:100%;"'
                        )
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Descripción de la zona, características especiales, notas importantes..."
            />
          </div>

          {/* Estado */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Zona activa
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Actualizar' : 'Crear'} Zona
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ZoneModal;
