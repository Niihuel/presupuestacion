/**
 * Componente para la primera etapa del wizard: Proyecto y Cliente
 * 
 * Permite definir la información básica del proyecto y seleccionar cliente
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Building, Calendar, FileText, AlertCircle } from 'lucide-react';
import { customerService } from '../../shared/services';

const EtapaProyectoCliente = ({ formData, updateFormData, errors = {} }) => {
  const [localData, setLocalData] = useState({
    project_name: '',
    description: '',
    customer_id: '',
    customer_contact: '',
    project_type: 'estructural',
    priority: 'media',
    estimated_delivery: '',
    notes: '',
    ...formData
  });

  // Query para obtener clientes
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Actualizar formData cuando localData cambie
  useEffect(() => {
    updateFormData(localData);
  }, [localData, updateFormData]);

  const handleInputChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerChange = (customerId) => {
    const selectedCustomer = customers?.data?.find(c => c.id === parseInt(customerId));
    
    setLocalData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_contact: selectedCustomer?.contact_person || '',
    }));
  };

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
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Información del Proyecto y Cliente
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Defina los datos básicos del proyecto y seleccione el cliente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Proyecto */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Datos del Proyecto
          </h4>

          {/* Nombre del Proyecto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto *
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
                {errors.project_name}
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
              placeholder="Descripción detallada del proyecto..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tipo de Proyecto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Proyecto
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
        </div>

        {/* Información del Cliente */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" />
            Datos del Cliente
          </h4>

          {/* Selección de Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            {loadingCustomers ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-500">Cargando clientes...</span>
              </div>
            ) : (
              <select
                value={localData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customer_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar cliente...</option>
                {customers?.data?.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            )}
            {errors.customer_id && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.customer_id}
              </p>
            )}
          </div>

          {/* Contacto del Cliente */}
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

          {/* Cliente Seleccionado - Preview */}
          {localData.customer_id && customers?.data && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Cliente Seleccionado</h5>
              {(() => {
                const customer = customers.data.find(c => c.id === parseInt(localData.customer_id));
                return customer ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Empresa:</span> {customer.name}</p>
                    <p><span className="font-medium">Email:</span> {customer.email}</p>
                    {customer.phone && <p><span className="font-medium">Teléfono:</span> {customer.phone}</p>}
                    {customer.address && <p><span className="font-medium">Dirección:</span> {customer.address}</p>}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Notas Adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales
            </label>
            <textarea
              value={localData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas o comentarios adicionales sobre el proyecto..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Resumen */}
      {(localData.project_name || localData.customer_id) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Resumen de la Etapa</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {localData.project_name && (
              <div>
                <span className="font-medium text-gray-700">Proyecto:</span>
                <span className="ml-2 text-gray-900">{localData.project_name}</span>
              </div>
            )}
            {localData.customer_id && customers?.data && (() => {
              const customer = customers.data.find(c => c.id === parseInt(localData.customer_id));
              return customer ? (
                <div>
                  <span className="font-medium text-gray-700">Cliente:</span>
                  <span className="ml-2 text-gray-900">{customer.name}</span>
                </div>
              ) : null;
            })()}
            {localData.project_type && (
              <div>
                <span className="font-medium text-gray-700">Tipo:</span>
                <span className="ml-2 text-gray-900">
                  {projectTypes.find(t => t.value === localData.project_type)?.label}
                </span>
              </div>
            )}
            {localData.priority && (
              <div>
                <span className="font-medium text-gray-700">Prioridad:</span>
                <span className={`ml-2 ${priorities.find(p => p.value === localData.priority)?.color}`}>
                  {priorities.find(p => p.value === localData.priority)?.label}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EtapaProyectoCliente;
