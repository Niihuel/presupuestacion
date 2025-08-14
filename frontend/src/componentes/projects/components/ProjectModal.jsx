/**
 * Modal para crear/editar proyectos/obras
 * 
 * Modal principal para la gestión de proyectos con:
 * - Información básica del proyecto
 * - Cliente y ubicación
 * - Fechas y estado
 * - Configuración avanzada
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Building, Calendar, MapPin, User, Save, Loader2, RefreshCw } from 'lucide-react';
import projectService from '@compartido/services/project.service';

const PROJECT_TYPES = [
  'Residencial',
  'Comercial',
  'Industrial',
  'Infraestructura',
  'Institucional',
  'Otro'
];

const PROJECT_STATUS = [
  { value: 'planning', label: 'Planificación' },
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' }
];

const ProjectModal = ({ isOpen, onClose, onSave, project = null, customers = [], mode = 'create' }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const isEditing = mode === 'edit';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      customer_id: '',
      project_type: '',
      status: 'planning',
      location_text: '', // Dirección como texto
      location_iframe: '', // Iframe de Google Maps
      is_active: true
    }
  });

  const watchedLocationText = watch('location_text');
  const watchedLocationIframe = watch('location_iframe');

  useEffect(() => {
    if (project && isOpen) {
      reset({
        name: project.name || '',
        code: project.code || '',
        description: project.description || project.notes || '',
        customer_id: project.customer_id || '',
        project_type: project.project_type || '',
        status: project.status || 'planning',
        location_text: project.city || '', // Mapear city a location_text
        location_iframe: project.location_iframe || '', // Nuevo campo
        is_active: project.is_active ?? true
      });
    } else if (!isOpen) {
      reset({
        name: '',
        code: '',
        description: '',
        customer_id: '',
        project_type: '',
        status: 'planning',
        location_text: '',
        location_iframe: '',
        is_active: true
      });
    }
  }, [project, isOpen, reset]);

  const generateProjectCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await projectService.generateProjectCode();
      if (response.success && response.data.code) {
        setValue('code', response.data.code);
      }
    } catch (error) {
      console.error('Error generating project code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const generateMapUrl = (location) => {
    if (!location || location.trim() === '') return null;
    const encodedLocation = encodeURIComponent(location.trim());
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodedLocation}`;
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Building className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h3>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modifica los datos del proyecto' : 'Crea un nuevo proyecto u obra'}
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

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white flex flex-col flex-1">
            <div className="px-6 py-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              <div className="space-y-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Información Básica
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Proyecto *
                      </label>
                      <input
                        type="text"
                        {...register('name', { 
                          required: 'El nombre es requerido',
                          minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Ej. Edificio Residencial Las Torres"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código del Proyecto
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          {...register('code')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ej. PROJ-2024-001"
                        />
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={generateProjectCode}
                            disabled={isGeneratingCode}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="inline h-4 w-4 mr-1" />
                        Cliente *
                      </label>
                      <select
                        {...register('customer_id', { required: 'El cliente es requerido' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar cliente</option>
                        {Array.isArray(customers) && customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                      {errors.customer_id && (
                        <p className="mt-1 text-xs text-red-600">{errors.customer_id.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Proyecto
                      </label>
                      <select
                        {...register('project_type')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar tipo</option>
                        {PROJECT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ubicación */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Ubicación del Proyecto
                  </h4>
                  
                  {/* Campo para dirección de texto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección <span className="text-gray-500 text-xs">(Opcional)</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Ingresa la dirección completa para calcular distancias y mostrar en el mapa
                    </p>
                    <input
                      type="text"
                      {...register('location_text')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Av. Colón 1234, Córdoba Capital"
                      maxLength="100"
                    />
                  </div>

                  {/* Campo para iframe de Google Maps */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mapa de Google Maps <span className="text-gray-500 text-xs">(Opcional)</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Pega aquí el código iframe de Google Maps para mostrar el mapa exacto
                    </p>
                    <textarea
                      {...register('location_iframe')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
                    />
                  </div>

                  {/* Vista previa del mapa si hay iframe */}
                  {watchedLocationIframe && watchedLocationIframe.trim() !== '' && watchedLocationIframe.includes('<iframe') && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Vista previa del mapa</span>
                        <button
                          type="button"
                          onClick={() => setShowMap(!showMap)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {showMap ? 'Ocultar mapa' : 'Mostrar mapa'}
                        </button>
                      </div>
                      {showMap && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: watchedLocationIframe.replace(
                                /width="[^"]*"/g, 'width="100%"'
                              ).replace(
                                /height="[^"]*"/g, 'height="400"'
                              ).replace(
                                /style="[^"]*"/g, 'style="border:0; border-radius: 8px; display: block;"'
                              )
                            }}
                            style={{ width: '100%', minHeight: '400px' }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vista previa automática si solo hay dirección de texto */}
                  {watchedLocationText && watchedLocationText.trim() !== '' && !watchedLocationIframe && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Vista previa del mapa (automática)</span>
                        <button
                          type="button"
                          onClick={() => setShowMap(!showMap)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {showMap ? 'Ocultar mapa' : 'Mostrar mapa'}
                        </button>
                      </div>
                      {showMap && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
                          <iframe
                            width="100%"
                            height="400"
                             style={{ border: 0, borderRadius: '8px', display: 'block' }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO8mPbIw4yd6c0&q=${encodeURIComponent(watchedLocationText)}`}
                            title="Project Location Map"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Estado */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      {...register('status')}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PROJECT_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción <span className="text-gray-500 text-xs">(Opcional)</span>
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Descripción detallada del proyecto, objetivos, especificaciones técnicas, etc..."
                    />
                  </div>
                </div>

                {/* Estado activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Proyecto activo
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 flex-shrink-0 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Actualizar' : 'Crear'} Proyecto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default ProjectModal;