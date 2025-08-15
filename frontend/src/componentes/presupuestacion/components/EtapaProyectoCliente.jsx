/**
 * Componente para la primera etapa del wizard: Obra y Cliente
 * 
 * Permite seleccionar una obra existente o crear una nueva y seleccionar cliente
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Building, Calendar, FileText, AlertCircle } from 'lucide-react';
import CustomerSelectorTable from './CustomerSelectorTable.jsx';
import ProjectSelectorTable from './ProjectSelectorTable.jsx';
import { customerService, projectService } from '@compartido/services';

const EtapaObrasCliente = ({ data, onChange, errors = {} }) => {
  const [localData, setLocalData] = useState({
    project_id: '',
    project_name: '',
    description: '',
    customer_id: '',
    customer_contact: '',
    project_type: 'estructural',
    priority: 'media',
    estimated_delivery: '',
    notes: '',
    create_new_project: false,
    ...data
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  // Query para obtener clientes (con búsqueda)
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers', { search: customerSearch }],
    queryFn: () => customerService.getCustomers({ search: customerSearch, limit: 50 }),
    staleTime: 10 * 60 * 1000,
  });

  // Query para obtener obras existentes (con búsqueda y opcional por cliente)
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', { search: projectSearch, customer_id: localData.customer_id }],
    queryFn: () => projectService.getAll({ search: projectSearch, customer_id: localData.customer_id, limit: 50 }),
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
          Seleccione el cliente y la obra existentes. Al elegir un cliente, la lista de obras se filtra automáticamente.
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
            {/* Selector de Obra con tabla resumida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Obra *</label>
              <ProjectSelectorTable
                customerId={localData.customer_id}
                value={localData.project_id}
                onChange={(row) => {
                  handleInputChange('project_id', row?.id || '');
                  if (!localData.customer_id && row?.customer_id) {
                    handleInputChange('customer_id', row.customer_id);
                  }
                }}
              />
              {errors.project_id && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Debe seleccionar una obra
                </p>
              )}
            </div>
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
            {/* Selección de Cliente con tabla resumida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <CustomerSelectorTable
                value={localData.customer_id}
                onChange={(row) => {
                  handleInputChange('customer_id', row?.id || '');
                  // Reset obra al cambiar cliente y dejar que ProjectSelectorTable filtre por customerId
                  handleInputChange('project_id', '');
                }}
              />
              {errors.customer_id && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Debe seleccionar un cliente
                </p>
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
