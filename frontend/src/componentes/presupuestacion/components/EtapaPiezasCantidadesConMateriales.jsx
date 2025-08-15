/**
 * Componente para selección de piezas con integración de materiales y plantas
 * 
 * Permite:
 * - Seleccionar planta de fabricación
 * - Ver piezas disponibles por planta
 * - Calcular costos de materiales automáticamente
 * - Verificar disponibilidad de materiales
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Search, 
  Calculator, 
  Weight,
  Factory,
  Layers,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { pieceService } from '@compartido/services';
import { materialService } from '@compartido/services/material.service';
import { useZones } from '@compartido/hooks/useZonesHook';
import { useMaterials } from '@compartido/hooks/useMaterialsHook';

const EtapaPiezasCantidadesConMateriales = ({ data, onChange, errors = {} }) => {
  const [localData, setLocalData] = useState({
    selectedPlant: '',
    pieces: [],
    notes: '',
    materialCalculations: {},
    ...data
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMaterialDetails, setShowMaterialDetails] = useState({});

  // Queries
  const { data: zones } = useZones();
  const { data: pieces, isLoading: loadingPieces } = useQuery({
    queryKey: ['pieces'],
    queryFn: () => pieceService.getPieces(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: materials } = useMaterials();

  // Actualizar formData cuando localData cambie
  useEffect(() => {
    onChange(localData);
  }, [localData, onChange]);

  // Filtrar piezas por búsqueda y categoría
  const filteredPieces = pieces?.data?.filter(piece => {
    const matchesSearch = piece.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         piece.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || piece.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Obtener categorías únicas
  const categories = [...new Set(pieces?.data?.map(piece => piece.category) || [])];

  // Manejar selección de planta
  const handlePlantChange = async (plantId) => {
    setLocalData(prev => ({
      ...prev,
      selectedPlant: plantId,
      materialCalculations: {} // Reset calculations when plant changes
    }));

    // Recalcular materiales para las piezas existentes
    if (localData.pieces.length > 0) {
      await recalculateMaterials(localData.pieces, plantId);
    }
  };

  // Recalcular materiales para todas las piezas
  const recalculateMaterials = async (pieces, plantId) => {
    const calculations = {};
    
    for (const piece of pieces) {
      try {
        const materialData = await materialService.calculatePieceMaterialCost(
          piece.piece_id, 
          plantId, 
          piece.quantity
        );
        calculations[piece.piece_id] = materialData;
      } catch (error) {
        console.error(`Error calculating materials for piece ${piece.piece_id}:`, error);
        calculations[piece.piece_id] = { error: 'Error al calcular materiales' };
      }
    }

    setLocalData(prev => ({
      ...prev,
      materialCalculations: calculations
    }));
  };

  const handleAddPiece = async (piece) => {
    const existingIndex = localData.pieces.findIndex(p => p.piece_id === piece.id);
    
    let updatedPieces;
    if (existingIndex >= 0) {
      // Si ya existe, incrementar cantidad
      updatedPieces = [...localData.pieces];
      updatedPieces[existingIndex].quantity += 1;
    } else {
      // Agregar nueva pieza
      const newPiece = {
        piece_id: piece.id,
        piece_code: piece.code,
        piece_name: piece.name,
        quantity: 1,
        unit_price: piece.unit_price || 0,
        weight: piece.weight || 0,
        category: piece.category,
        description: piece.description || ''
      };
      updatedPieces = [...localData.pieces, newPiece];
    }

    setLocalData(prev => ({
      ...prev,
      pieces: updatedPieces
    }));

    // Calcular materiales si hay planta seleccionada
    if (localData.selectedPlant) {
      await recalculateMaterials(updatedPieces, localData.selectedPlant);
    }
  };

  const handleRemovePiece = (index) => {
    const updatedPieces = localData.pieces.filter((_, i) => i !== index);
    const removedPiece = localData.pieces[index];
    
    setLocalData(prev => {
      const newCalculations = { ...prev.materialCalculations };
      delete newCalculations[removedPiece.piece_id];
      
      return {
        ...prev,
        pieces: updatedPieces,
        materialCalculations: newCalculations
      };
    });
  };

  const handleUpdatePiece = async (index, field, value) => {
    const updatedPieces = [...localData.pieces];
    updatedPieces[index] = {
      ...updatedPieces[index],
      [field]: field === 'quantity' || field === 'unit_price' || field === 'weight' ? 
               parseFloat(value) || 0 : value
    };

    setLocalData(prev => ({
      ...prev,
      pieces: updatedPieces
    }));

    // Recalcular materiales si cambió la cantidad
    if (field === 'quantity' && localData.selectedPlant) {
      await recalculateMaterials(updatedPieces, localData.selectedPlant);
    }
  };

  // Calcular totales incluyendo materiales
  const calculateTotals = () => {
    const pieceTotals = localData.pieces.reduce((acc, piece) => {
      const itemTotal = piece.quantity * piece.unit_price;
      const itemWeight = piece.quantity * piece.weight;
      
      return {
        piecesTotal: acc.piecesTotal + itemTotal,
        weight: acc.weight + itemWeight,
        items: acc.items + piece.quantity
      };
    }, { piecesTotal: 0, weight: 0, items: 0 });

    // Calcular total de materiales
    const materialsTotal = Object.values(localData.materialCalculations).reduce((acc, calc) => {
      return acc + (calc.totalCost || 0);
    }, 0);

    return {
      ...pieceTotals,
      materialsTotal,
      grandTotal: pieceTotals.piecesTotal + materialsTotal
    };
  };

  const totals = calculateTotals();

  // Verificar disponibilidad de materiales
  const getMaterialAvailabilityStatus = (pieceId) => {
    const calc = localData.materialCalculations[pieceId];
    if (!calc || calc.error) return 'unknown';
    
    if (calc.hasInsufficientMaterials) return 'insufficient';
    if (calc.hasLowStockMaterials) return 'low';
    return 'available';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'insufficient': return <X className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Materiales disponibles';
      case 'low': return 'Stock bajo en algunos materiales';
      case 'insufficient': return 'Materiales insuficientes';
      default: return 'Estado desconocido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Selección de Piezas, Cantidades y Planta
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Seleccione la planta de fabricación y las piezas necesarias con sus cantidades
        </p>
      </div>

      {/* Selección de Planta */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
          <Factory className="w-4 h-4 text-blue-600" />
          Planta de Fabricación
        </h4>
        <select
          value={localData.selectedPlant}
          onChange={(e) => handlePlantChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.selectedPlant ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Seleccionar planta...</option>
          {zones?.zones?.map(zone => (
            <option key={zone.id} value={zone.id}>{zone.name}</option>
          ))}
        </select>
        {errors.selectedPlant && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.selectedPlant}
          </p>
        )}
        {localData.selectedPlant && (
          <p className="mt-2 text-sm text-blue-600">
            Los costos de materiales se calcularán automáticamente para esta planta
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Búsqueda y Catálogo */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Catálogo de Piezas
          </h4>

          {/* Filtros */}
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Piezas */}
          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            {loadingPieces ? (
              <div className="p-4 text-center text-gray-500">
                Cargando piezas...
              </div>
            ) : filteredPieces.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No se encontraron piezas
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPieces.map(piece => (
                  <div
                    key={piece.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAddPiece(piece)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{piece.name}</h5>
                        <p className="text-sm text-gray-600">Código: {piece.code}</p>
                        {piece.description && (
                          <p className="text-xs text-gray-500 mt-1">{piece.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Precio: ${piece.unit_price?.toLocaleString()}</span>
                          {piece.weight && <span>Peso: {piece.weight} kg</span>}
                          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                            {piece.category}
                          </span>
                        </div>
                      </div>
                      <button className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Piezas Seleccionadas */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Piezas Seleccionadas
            {localData.pieces.length > 0 && (
              <span className="text-sm text-gray-500">({localData.pieces.length})</span>
            )}
          </h4>

          {localData.pieces.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-gray-500 mt-2">No hay piezas seleccionadas</p>
              <p className="text-sm text-gray-400">Haz clic en una pieza del catálogo para agregarla</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {localData.pieces.map((piece, index) => {
                const materialStatus = getMaterialAvailabilityStatus(piece.piece_id);
                const materialCalc = localData.materialCalculations[piece.piece_id];
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{piece.piece_name}</h5>
                        <p className="text-sm text-gray-600">Código: {piece.piece_code}</p>
                        
                        {/* Estado de materiales */}
                        {localData.selectedPlant && (
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(materialStatus)}
                            <span className="text-xs text-gray-600">
                              {getStatusText(materialStatus)}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemovePiece(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={piece.quantity}
                          onChange={(e) => handleUpdatePiece(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio Unitario
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={piece.unit_price}
                          onChange={(e) => handleUpdatePiece(index, 'unit_price', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Detalles de materiales */}
                    {materialCalc && !materialCalc.error && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            Costo de Materiales
                          </span>
                          <button
                            onClick={() => setShowMaterialDetails(prev => ({
                              ...prev,
                              [piece.piece_id]: !prev[piece.piece_id]
                            }))}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {showMaterialDetails[piece.piece_id] ? 'Ocultar' : 'Ver detalles'}
                          </button>
                        </div>
                        
                        <div className="text-sm font-medium text-green-600">
                          ${materialCalc.totalCost?.toLocaleString()} 
                          <span className="text-xs text-gray-500 ml-1">
                            (${(materialCalc.totalCost / piece.quantity).toLocaleString()} por unidad)
                          </span>
                        </div>

                        {showMaterialDetails[piece.piece_id] && materialCalc.materials && (
                          <div className="mt-3 space-y-2">
                            {materialCalc.materials.map((material, matIndex) => (
                              <div key={matIndex} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">
                                  {material.name} ({material.quantity} {material.unit})
                                </span>
                                <span className="font-medium">${material.cost.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {materialCalc?.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-3">
                        <p className="text-xs text-red-600">{materialCalc.error}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Subtotal pieza:</span>
                      <span className="font-medium">${(piece.quantity * piece.unit_price).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resumen de Totales */}
      {localData.pieces.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Resumen de Costos
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Piezas</p>
              <p className="text-lg font-semibold text-blue-600">
                ${totals.piecesTotal.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Materiales</p>
              <p className="text-lg font-semibold text-green-600">
                ${totals.materialsTotal.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Peso Total</p>
              <p className="text-lg font-semibold text-purple-600">
                {totals.weight.toLocaleString()} kg
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Total General</p>
              <p className="text-xl font-bold text-gray-900">
                ${totals.grandTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notas adicionales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas adicionales
        </label>
        <textarea
          value={localData.notes}
          onChange={(e) => setLocalData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Observaciones o instrucciones especiales..."
        />
      </div>

      {errors.pieces && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errors.pieces}
          </p>
        </div>
      )}
    </div>
  );
};

export default EtapaPiezasCantidadesConMateriales;
