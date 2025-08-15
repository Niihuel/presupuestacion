/**
 * Modal de Proyecto usando FormModal Reutilizable
 * 
 * Modal refactorizado para crear/editar proyectos usando el sistema 
 * de modales corporativo. Incluye formulario completo con validación,
 * selección de clientes y estados.
 */

import React, { useState, useEffect } from 'react';
import { FormModal } from '@compartido/componentes/modals';
import { 
  Building2, 
  User, 
  Calendar, 
  FileText,
  DollarSign,
  AlertTriangle,
  Clock,
  Flag,
  MapPin,
  Users,
  AlertCircle
} from 'lucide-react';
import { useCustomers } from '@compartido/hooks';

// Estados disponibles para proyectos
const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planificación', color: 'blue' },
  { value: 'in_progress', label: 'En Progreso', color: 'yellow' },
  { value: 'on_hold', label: 'En Pausa', color: 'orange' },
  { value: 'completed', label: 'Completado', color: 'green' },
  { value: 'cancelled', label: 'Cancelado', color: 'red' }
];

// Niveles de prioridad
const PRIORITY_LEVELS = [
  { value: 'low', label: 'Baja', color: 'gray' },
  { value: 'medium', label: 'Media', color: 'blue' },
  { value: 'high', label: 'Alta', color: 'orange' },
  { value: 'urgent', label: 'Urgente', color: 'red' }
];

const ProjectModal = ({ 
  project = null, 
  onClose,
  onSave,
  isLoading = false 
}) => {
  const isOpen = project !== null;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer_id: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    estimated_budget: '',
    actual_budget: '',
    location: '',
    project_manager: '',
    team_members: '',
    notes: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});

  // Hook para obtener clientes
  const { data: customersData } = useCustomers();
  const customers = customersData?.customers || [];

  // Llenar formulario cuando se pasa un proyecto para editar
  useEffect(() => {
    if (isOpen && project && project.id) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        customer_id: project.customer_id || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        estimated_budget: project.estimated_budget ? project.estimated_budget.toString() : '',
        actual_budget: project.actual_budget ? project.actual_budget.toString() : '',
        location: project.location || '',
        project_manager: project.project_manager || '',
        team_members: project.team_members || '',
        notes: project.notes || '',
        is_active: project.is_active !== undefined ? project.is_active : true
      });
    } else if (isOpen && (!project || !project.id)) {
      // Reset para nuevo proyecto
      setFormData({
        name: '',
        description: '',
        customer_id: '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        end_date: '',
        estimated_budget: '',
        actual_budget: '',
        location: '',
        project_manager: '',
        team_members: '',
        notes: '',
        is_active: true
      });
    }
    setErrors({});
  }, [isOpen, project]);

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es requerido';
    }

    if (!formData.customer_id) {
      newErrors.customer_id = 'Debe seleccionar un cliente';
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (formData.estimated_budget && (isNaN(formData.estimated_budget) || parseFloat(formData.estimated_budget) < 0)) {
      newErrors.estimated_budget = 'El presupuesto estimado debe ser un número positivo';
    }

    if (formData.actual_budget && (isNaN(formData.actual_budget) || parseFloat(formData.actual_budget) < 0)) {
      newErrors.actual_budget = 'El presupuesto real debe ser un número positivo';
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

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Preparar datos para envío
    const dataToSend = {
      ...formData,
      estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
      actual_budget: formData.actual_budget ? parseFloat(formData.actual_budget) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    };

    onSave(dataToSend);
  };

  const title = project && project.id ? 'Editar Proyecto' : 'Nuevo Proyecto';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      submitText={project && project.id ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      isLoading={isLoading}
      size="xl"
    >
      <div className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            Información Básica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ingrese el nombre del proyecto"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleInputChange('customer_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customer_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar cliente...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.customer_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROJECT_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ubicación del proyecto"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción detallada del proyecto..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Fechas y Cronograma */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            Fechas y Cronograma
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin Estimada
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.end_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Presupuesto */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
            Presupuesto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Presupuesto Estimado
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.estimated_budget}
                  onChange={(e) => handleInputChange('estimated_budget', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.estimated_budget ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.estimated_budget && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.estimated_budget}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Presupuesto Real
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.actual_budget}
                  onChange={(e) => handleInputChange('actual_budget', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.actual_budget ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.actual_budget && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.actual_budget}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Equipo */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Users className="h-5 w-5 text-orange-600 mr-2" />
            Equipo del Proyecto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gerente del Proyecto
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.project_manager}
                  onChange={(e) => handleInputChange('project_manager', e.target.value)}
                  placeholder="Nombre del gerente"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miembros del Equipo
              </label>
              <input
                type="text"
                value={formData.team_members}
                onChange={(e) => handleInputChange('team_members', e.target.value)}
                placeholder="Ej: Juan Pérez, María González, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notas adicionales */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <FileText className="h-5 w-5 text-indigo-600 mr-2" />
            Información Adicional
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas del Proyecto
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Información adicional, requisitos especiales, observaciones..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900">Proyecto activo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Información del sistema (solo en edición) */}
        {project && project.id && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Clock className="h-5 w-5 text-gray-600 mr-2" />
              Información del Sistema
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Creado:</span>
                <span className="ml-2">
                  {project.created_at 
                    ? new Date(project.created_at).toLocaleDateString('es-ES') 
                    : 'Sin especificar'
                  }
                </span>
              </div>
              <div>
                <span className="font-medium">Actualizado:</span>
                <span className="ml-2">
                  {project.updated_at 
                    ? new Date(project.updated_at).toLocaleDateString('es-ES') 
                    : 'Sin especificar'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
};

export default ProjectModal;
