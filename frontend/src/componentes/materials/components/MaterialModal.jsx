/**
 * Modal para crear/editar materiales
 * 
 * Formulario completo para gestión de materiales con:
 * - Información básica (nombre, código, categoría, unidad)
 * - Proveedores y precios por planta
 * - Stock inicial por planta
 * - Validaciones y manejo de errores
 */

import React, { useState, useEffect } from 'react';
import { 
  X,
  Save, 
  Package, 
  Plus, 
  Trash2,
  AlertCircle,
  DollarSign,
  Factory,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useCreateMaterial, useUpdateMaterial } from '@compartido/hooks/useMaterialsHook';
import { useNotifications } from '@compartido/hooks/useNotifications';
import materialService from '@compartido/services/material.service';

const MaterialModal = ({ material, mode, zones, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    unit: '',
    description: '',
    minStock: 0,
    suppliers: [{ name: '', contactInfo: '', isDefault: true }],
    plantPrices: {},
    plantStocks: {}
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const { showNotification } = useNotifications();

  // Categorías de materiales
  const materialCategories = [
    'Hormigón',
    'Acero',
    'Insertos Metálicos',
    'Geotextil',
    'Aditivos',
    'Herramientas',
    'Otros'
  ];

  // Unidades de medida
  const materialUnits = [
    'kg',
    'm³',
    'm²',
    'm',
    'litros',
    'toneladas',
    'unidades',
    'piezas'
  ];

  // Inicializar formulario
  useEffect(() => {
    if (material && mode === 'edit') {
      setFormData({
        name: material.name || '',
        code: material.code || '',
        category: material.category || '',
        unit: material.unit || '',
        description: material.description || '',
        minStock: material.minStock || 0,
        suppliers: material.suppliers?.length > 0 ? material.suppliers : [{ name: '', contactInfo: '', isDefault: true }],
        plantPrices: material.plantPrices || {},
        plantStocks: material.plantStocks || {}
      });
    } else {
      // Inicializar precios y stocks para todas las plantas
      const initialPrices = {};
      const initialStocks = {};
      
      zones.forEach(zone => {
        initialPrices[zone.id] = '';
        initialStocks[zone.id] = '';
      });

      setFormData(prev => ({
        ...prev,
        plantPrices: initialPrices,
        plantStocks: initialStocks
      }));
    }
  }, [material, mode, zones]);

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Manejar cambios en proveedores
  const handleSupplierChange = (index, field, value) => {
    const newSuppliers = [...formData.suppliers];
    newSuppliers[index] = {
      ...newSuppliers[index],
      [field]: value
    };

    // Si se marca como default, desmarcar otros
    if (field === 'isDefault' && value) {
      newSuppliers.forEach((supplier, i) => {
        if (i !== index) supplier.isDefault = false;
      });
    }

    setFormData(prev => ({
      ...prev,
      suppliers: newSuppliers
    }));
  };

  // Agregar proveedor
  const addSupplier = () => {
    setFormData(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, { name: '', contactInfo: '', isDefault: false }]
    }));
  };

  // Eliminar proveedor
  const removeSupplier = (index) => {
    if (formData.suppliers.length > 1) {
      const newSuppliers = formData.suppliers.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        suppliers: newSuppliers
      }));
    }
  };

  // Manejar cambios en precios por planta
  const handlePlantPriceChange = (plantId, value) => {
    setFormData(prev => ({
      ...prev,
      plantPrices: {
        ...prev.plantPrices,
        [plantId]: value
      }
    }));
  };

  // Manejar cambios en stock por planta
  const handlePlantStockChange = (plantId, value) => {
    setFormData(prev => ({
      ...prev,
      plantStocks: {
        ...prev.plantStocks,
        [plantId]: value
      }
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.unit) {
      newErrors.unit = 'La unidad es requerida';
    }

    // Validar que al menos un proveedor tenga nombre
    const validSuppliers = formData.suppliers.filter(s => s.name.trim());
    if (validSuppliers.length === 0) {
      newErrors.suppliers = 'Debe agregar al menos un proveedor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const materialData = {
        ...formData,
        suppliers: formData.suppliers.filter(s => s.name.trim()),
        plantPrices: Object.fromEntries(
          Object.entries(formData.plantPrices).filter(([_, price]) => price && price > 0)
        ),
        plantStocks: Object.fromEntries(
          Object.entries(formData.plantStocks).filter(([_, stock]) => stock && stock >= 0)
        )
      };

      if (mode === 'edit') {
        await updateMaterial.mutateAsync({ id: material.id, ...materialData });
        showNotification('Material actualizado correctamente', 'success');
      } else {
        await createMaterial.mutateAsync(materialData);
        showNotification('Material creado correctamente', 'success');
      }

      onClose();
    } catch (error) {
      console.error('Error saving material:', error);
      showNotification(
        error.response?.data?.message || 'Error al guardar el material',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? 'Editar Material' : 'Nuevo Material'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'edit' 
                  ? 'Modifica la información del material'
                  : 'Completa los datos del nuevo material'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información básica */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Material *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="ej. Hormigón H30"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.code ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej. MAT-2025-001"
                    />
                    {mode !== 'edit' && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsGeneratingCode(true);
                          try {
                            const res = await materialService.generateMaterialCode();
                            const code = res?.data?.code || res?.code; // tolerar respuesta simple
                            if (code) handleInputChange('code', code);
                          } catch (e) {
                            console.error('Error generating material code', e);
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
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar categoría</option>
                    {materialCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.unit ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar unidad</option>
                    {materialUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  {errors.unit && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.unit}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => handleInputChange('minStock', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descripción opcional del material"
                />
              </div>
            </div>

            {/* Proveedores */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Proveedores</h3>
                <button
                  type="button"
                  onClick={addSupplier}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
              
              {errors.suppliers && (
                <p className="mb-4 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.suppliers}
                </p>
              )}

              <div className="space-y-3">
                {formData.suppliers.map((supplier, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre del proveedor
                        </label>
                        <input
                          type="text"
                          value={supplier.name}
                          onChange={(e) => handleSupplierChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ej. Proveedor ABC"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Información de contacto
                        </label>
                        <input
                          type="text"
                          value={supplier.contactInfo}
                          onChange={(e) => handleSupplierChange(index, 'contactInfo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Teléfono o email"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={supplier.isDefault}
                            onChange={(e) => handleSupplierChange(index, 'isDefault', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Principal</span>
                        </label>
                        
                        {formData.suppliers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSupplier(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Precios y Stock por Planta */}
            {zones.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Precios y Stock por Planta</h3>
                
                <div className="space-y-4">
                  {zones.map(zone => (
                    <div key={zone.id} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Factory className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">{zone.name}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio por {formData.unit || 'unidad'}
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.plantPrices[zone.id] || ''}
                              onChange={(e) => handlePlantPriceChange(zone.id, parseFloat(e.target.value) || '')}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stock inicial
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.plantStocks[zone.id] || ''}
                            onChange={(e) => handlePlantStockChange(zone.id, parseFloat(e.target.value) || '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? 'Guardando...' : (mode === 'edit' ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialModal;
