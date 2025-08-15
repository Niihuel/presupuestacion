/**
 * Componente para gestión de fórmulas de materiales por pieza
 * 
 * Permite:
 * - Ver materiales necesarios para una pieza
 * - Agregar/editar/remover materiales de la fórmula
 * - Definir cantidades y factores de desperdicio
 * - Copiar fórmulas entre piezas
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  Calculator,
  Layers,
  Search,
  Filter
} from 'lucide-react';

import { usePieceMaterialFormula } from '@shared/hooks/usePieceMaterialFormula';
import useMateriales from '@compartido/hooks/useMateriales';
import usePiezas from '@compartido/hooks/usePiezas';
import { useNotifications } from '@shared/hooks/useNotifications';

const PieceMaterialFormulaManager = ({ 
  pieceId, 
  pieceName,
  onClose,
  onSave 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formulaChanges, setFormulaChanges] = useState([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Hooks
  const { success, error, warning } = useNotifications();
  const { 
    formula, 
    isLoading: loadingFormula,
    updateFormula,
    addMaterial,
    removeMaterial,
    validateFormula,
    isUpdating 
  } = usePieceMaterialFormula(pieceId);

  const { data: materials, isLoading: loadingMaterials } = useMaterials();
  const { data: pieces } = usePieces();

  // Estado local de la fórmula (para edición)
  const [localFormula, setLocalFormula] = useState([]);

  useEffect(() => {
    if (formula) {
      setLocalFormula(formula.map(item => ({
        ...item,
        isEditing: false
      })));
    }
  }, [formula]);

  // Materiales disponibles filtrados
  const availableMaterials = materials?.materials?.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || material.category === selectedCategory;
    const notInFormula = !localFormula.some(f => f.material_id === material.id);
    
    return matchesSearch && matchesCategory && notInFormula && material.is_active;
  }) || [];

  // Categorías de materiales
  const categories = [...new Set(materials?.materials?.map(m => m.category) || [])];

  /**
   * Agregar material a la fórmula local
   */
  const handleAddMaterial = (material) => {
    const newItem = {
      id: Date.now(), // ID temporal
      material_id: material.id,
      material_name: material.name,
      material_code: material.code,
      material_category: material.category,
      material_unit: material.unit,
      quantity_per_unit: 1.0,
      waste_factor: 1.0,
      is_optional: false,
      notes: '',
      isNew: true,
      isEditing: true
    };

    setLocalFormula(prev => [...prev, newItem]);
    setShowAddMaterial(false);
    setSearchTerm('');
  };

  /**
   * Editar material en la fórmula
   */
  const handleEditMaterial = (index) => {
    setLocalFormula(prev => prev.map((item, i) => ({
      ...item,
      isEditing: i === index
    })));
  };

  /**
   * Guardar cambios en un material
   */
  const handleSaveMaterial = (index) => {
    setLocalFormula(prev => prev.map((item, i) => ({
      ...item,
      isEditing: false,
      ...(i === index && { isModified: true })
    })));
  };

  /**
   * Cancelar edición de material
   */
  const handleCancelEdit = (index) => {
    setLocalFormula(prev => {
      const newFormula = [...prev];
      if (newFormula[index].isNew) {
        // Si es nuevo, eliminarlo
        return newFormula.filter((_, i) => i !== index);
      } else {
        // Si es existente, restaurar valores originales
        const original = formula.find(f => f.id === newFormula[index].id);
        newFormula[index] = {
          ...original,
          isEditing: false,
          isModified: false
        };
        return newFormula;
      }
    });
  };

  /**
   * Remover material de la fórmula
   */
  const handleRemoveMaterial = (index) => {
    const material = localFormula[index];
    
    if (window.confirm(`¿Eliminar ${material.material_name} de la fórmula?`)) {
      setLocalFormula(prev => prev.filter((_, i) => i !== index));
    }
  };

  /**
   * Actualizar campo de material
   */
  const handleUpdateMaterialField = (index, field, value) => {
    setLocalFormula(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  /**
   * Validar fórmula actual
   */
  const handleValidateFormula = async () => {
    const materialsToValidate = localFormula.map(item => ({
      materialId: item.material_id,
      quantityPerUnit: parseFloat(item.quantity_per_unit),
      wasteFactor: parseFloat(item.waste_factor),
      isOptional: item.is_optional
    }));

    const validation = await validateFormula(materialsToValidate);
    setValidationResult(validation);

    if (validation.valid) {
      success('Fórmula válida');
    } else {
      error(`Fórmula inválida: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings && validation.warnings.length > 0) {
      warning(`Advertencias: ${validation.warnings.join(', ')}`);
    }
  };

  /**
   * Guardar fórmula completa
   */
  const handleSaveFormula = async () => {
    try {
      const materialsToSave = localFormula.map(item => ({
        materialId: item.material_id,
        quantityPerUnit: parseFloat(item.quantity_per_unit),
        wasteFactor: parseFloat(item.waste_factor),
        isOptional: item.is_optional,
        notes: item.notes
      }));

      await updateFormula({ pieceId, materials: materialsToSave });
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving formula:', err);
    }
  };

  /**
   * Renderizar fila de material
   */
  const renderMaterialRow = (item, index) => {
    const isEditing = item.isEditing;

    return (
      <div key={item.id || index} className={`p-4 border rounded-lg ${
        item.isNew ? 'border-green-200 bg-green-50' : 
        item.isModified ? 'border-blue-200 bg-blue-50' : 
        'border-gray-200 bg-white'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                item.material_category === 'Hormigón' ? 'bg-gray-500' :
                item.material_category === 'Acero' ? 'bg-red-500' :
                item.material_category === 'Insertos Metálicos' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`} />
              <div>
                <h4 className="font-medium text-gray-900">{item.material_name}</h4>
                <p className="text-sm text-gray-600">
                  {item.material_code} • {item.material_category}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cantidad por unidad
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.quantity_per_unit}
                    onChange={(e) => handleUpdateMaterialField(index, 'quantity_per_unit', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    {item.quantity_per_unit} {item.material_unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Factor desperdicio
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    value={item.waste_factor}
                    onChange={(e) => handleUpdateMaterialField(index, 'waste_factor', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    {item.waste_factor}x {item.waste_factor > 1 ? `(+${((item.waste_factor - 1) * 100).toFixed(1)}%)` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cantidad real
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {(item.quantity_per_unit * item.waste_factor).toFixed(4)} {item.material_unit}
                </p>
              </div>

              <div className="flex items-center">
                {isEditing ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.is_optional}
                      onChange={(e) => handleUpdateMaterialField(index, 'is_optional', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">Opcional</span>
                  </label>
                ) : (
                  item.is_optional && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Opcional
                    </span>
                  )
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={item.notes}
                  onChange={(e) => handleUpdateMaterialField(index, 'notes', e.target.value)}
                  placeholder="Notas adicionales sobre este material..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {!isEditing && item.notes && (
              <div className="mt-2">
                <p className="text-xs text-gray-600">{item.notes}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleSaveMaterial(index)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Guardar"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCancelEdit(index)}
                  className="p-1 text-gray-500 hover:bg-gray-50 rounded transition-colors"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleEditMaterial(index)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveMaterial(index)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loadingFormula || loadingMaterials) {
    return (
      <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando fórmula...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Fórmula de Materiales
              </h2>
              <p className="text-sm text-gray-600">{pieceName}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleValidateFormula}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Validar
              </button>
              
              <button
                onClick={handleSaveFormula}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isUpdating ? 'Guardando...' : 'Guardar Fórmula'}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="px-6 py-3 border-b border-gray-200">
            {validationResult.valid ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Fórmula válida</span>
              </div>
            ) : (
              <div className="space-y-2">
                {validationResult.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                ))}
              </div>
            )}
            
            {validationResult.warnings && validationResult.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex h-[calc(90vh-120px)]">
          {/* Lista de materiales en la fórmula */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                Materiales en la Fórmula ({localFormula.length})
              </h3>
              
              <button
                onClick={() => setShowAddMaterial(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Material
              </button>
            </div>

            <div className="space-y-3">
              {localFormula.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay materiales en la fórmula</p>
                  <p className="text-sm text-gray-400">Agrega materiales para definir la composición de esta pieza</p>
                </div>
              ) : (
                localFormula.map((item, index) => renderMaterialRow(item, index))
              )}
            </div>
          </div>

          {/* Panel de materiales disponibles */}
          {showAddMaterial && (
            <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Agregar Material</h3>
                <button
                  onClick={() => setShowAddMaterial(false)}
                  className="p-1 text-gray-500 hover:bg-gray-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filtros */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar materiales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de materiales */}
              <div className="space-y-2">
                {availableMaterials.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay materiales disponibles
                  </p>
                ) : (
                  availableMaterials.map(material => (
                    <div
                      key={material.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleAddMaterial(material)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          material.category === 'Hormigón' ? 'bg-gray-500' :
                          material.category === 'Acero' ? 'bg-red-500' :
                          material.category === 'Insertos Metálicos' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{material.name}</p>
                          <p className="text-xs text-gray-600">
                            {material.code} • {material.unit}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PieceMaterialFormulaManager;
