/**
 * Componente para la primera etapa del wizard: Obra y Cliente
 * 
 * Permite seleccionar una obra existente o crear una nueva y seleccionar cliente
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Building, Calendar, FileText, AlertCircle } from 'lucide-react';
import { customerService, projectService } from '../../../shared/services';

const EtapaObrasCliente = ({ data, onChange, errors = {} }) => {
  const [localData, setLocalData] = useState({
    project_id: '',
    project_name: '', // Para crear nueva obra
    description: '',
    customer_id: '',
    customer_contact: '',
    project_type: 'estructural',
    priority: 'media',
    estimated_delivery: '',
    notes: '',
    create_new_project: false, // Flag para crear nueva obra
    ...data
  });

  // Query para obtener clientes
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 10 * 60 * 1000,
  });

  // Query para obtener obras existentes
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
    staleTime: 10 * 60 * 1000,
  });

  // Actualizar datos cuando localData cambie
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange(localData);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(localData)]);

  const handleInputChange = useCallback((field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const projectTypes = [
    { value: 'estructural', label: 'Estructural' },
    { value: 'arquitectonico', label: 'Arquitectónico' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'residencial', label: 'Residencial' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'otro', label: 'Otro' }
  ];

  const priorities = [
    { value: 'baja', label: 'Baja', color: 'text-green-600' },
    { value: 'media', label: 'Media', color: 'text-yellow-600' },
    { value: 'alta', label: 'Alta', color: 'text-red-600' },
    { value: 'urgente', label: 'Urgente', color: 'text-red-800 font-semibold' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          Información de la Obra y Cliente
        </h3>
        <p className="text-gray-600 mt-2">
          Seleccione la obra existente o cree una nueva, y seleccione el cliente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la Obra */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-green-100 rounded-md">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            Datos de la Obra
          </h4>
          
          <div className="space-y-4">
            {/* Selector: Obra existente o crear nueva */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Desea seleccionar una obra existente o crear una nueva?
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="project_selection"
                    checked={!localData.create_new_project}
                    onChange={() => handleInputChange('create_new_project', false)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Seleccionar obra existente</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="project_selection"
                    checked={localData.create_new_project}
                    onChange={() => handleInputChange('create_new_project', true)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Crear nueva obra</span>
                </label>
              </div>
            </div>

            {/* Selector de Obra Existente */}
            {!localData.create_new_project && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obra *
                </label>
                <select
                  value={localData.project_id}
                  onChange={(e) => handleInputChange('project_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.project_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loadingProjects}
                >
                  <option value="">Seleccionar obra...</option>
                  {projects?.data?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.customer_name}
                    </option>
                  ))}
                </select>
                {errors.project_id && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Debe seleccionar una obra
                  </p>
                )}
                {loadingProjects && (
                  <p className="text-sm text-gray-500 mt-1">Cargando obras...</p>
                )}
              </div>
            )}

            {/* Campos para Nueva Obra */}
            {localData.create_new_project && (
              <>
                {/* Nombre de la Obra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Obra *
                  </label>
                  <input
                    type="text"
                    value={localData.project_name}
                    onChange={(e) => handleInputChange('project_name', e.target.value)}
                    placeholder="Ej: Edificio Corporativo ABC"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.project_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.project_name && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      El nombre de la obra es requerido
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={localData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descripción detallada de la obra..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Tipo de Obra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Obra
                  </label>
                  <select
                    value={localData.project_type}
                    onChange={(e) => handleInputChange('project_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {projectTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={localData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Prioridad actual:</span>
                    <span className={`text-xs font-medium ${priorities.find(p => p.value === localData.priority)?.color}`}>
                      {priorities.find(p => p.value === localData.priority)?.label}
                    </span>
                  </div>
                </div>

                {/* Fecha Estimada de Entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Estimada de Entrega
                  </label>
                  <input
                    type="date"
                    value={localData.estimated_delivery}
                    onChange={(e) => handleInputChange('estimated_delivery', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-100 rounded-md">
              <User className="w-4 h-4 text-purple-600" />
            </div>
            Datos del Cliente
          </h4>
          
          <div className="space-y-4">
            {/* Selección de Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                value={localData.customer_id}
                onChange={(e) => handleInputChange('customer_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customer_id ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loadingCustomers}
              >
                <option value="">Seleccionar cliente...</option>
                {customers?.data?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name} - {customer.contact_name}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Debe seleccionar un cliente
                </p>
              )}
              {loadingCustomers && (
                <p className="text-sm text-gray-500 mt-1">Cargando clientes...</p>
              )}
            </div>

            {/* Persona de Contacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                value={localData.customer_contact}
                onChange={(e) => handleInputChange('customer_contact', e.target.value)}
                placeholder="Nombre del contacto principal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notas Adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <textarea
                value={localData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notas o comentarios adicionales sobre la obra..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtapaObrasCliente;
