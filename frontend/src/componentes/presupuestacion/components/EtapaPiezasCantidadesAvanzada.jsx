/**
 * Etapa Avanzada de Piezas y Cantidades con Cálculo de Materiales
 * 
 * Integra completamente el flujo:
 * 1. Selección de Planta → 2. Selección de Piezas → 3. Cálculo Automático de Materiales
 * 
 * Funcionalidades:
 * - Seleccionar planta de fabricación (afecta precios y disponibilidad)
 * - Catálogo de piezas filtrable
 * - Cálculo automático de materiales por pieza
 * - Verificación de disponibilidad de stock
 * - Alertas de stock bajo o insuficiente
 * - Resumen de costos por material y pieza
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  Info,
  Eye,
  Zap,
  TrendingUp,
  Package2
} from 'lucide-react';

// Services
import { pieceService } from '@compartido/services';
import { materialService } from '@compartido/services/material.service';

// Hooks
import { useZones } from '@compartido/hooks/useZonesHook';
import { useNotifications } from '@compartido/hooks/useNotificaciones';

const EtapaPiezasCantidadesAvanzada = ({ data, onChange, errors = {} }) => {
  // Estados locales
  const [localData, setLocalData] = useState({
    selectedPlant: '',
    pieces: [],
    notes: '',
    materialCalculations: {},
    materialSummary: {
      totalCost: 0,
      materials: {},
      warnings: []
    },
    ...data
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMaterialDetails, setShowMaterialDetails] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [expandedPieces, setExpandedPieces] = useState({});

  // Hooks
  const { success, error, warning } = useNotifications();

  // Queries
  const { data: zones, isLoading: loadingZones } = useZones();
  
  const { data: pieces, isLoading: loadingPieces } = useQuery({
    queryKey: ['pieces', localData.selectedPlant],
    queryFn: () => pieceService.getPieces({ 
      includeFormulas: true,
      plant: localData.selectedPlant 
    }),
    enabled: !!localData.selectedPlant,
    staleTime: 5 * 60 * 1000,
  });

  // Sincronizar datos con el componente padre
  useEffect(() => {
    onChange(localData);
  }, [localData, onChange]);

  // Memoized filtered pieces
  const filteredPieces = useMemo(() => {
    if (!pieces?.data) return [];
    
    return pieces.data.filter(piece => {
      const matchesSearch = piece.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           piece.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || piece.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [pieces, searchTerm, selectedCategory]);

  // Categorías disponibles
  const categories = useMemo(() => {
    if (!pieces?.data) return [];
    return [...new Set(pieces.data.map(piece => piece.category))];
  }, [pieces]);

  // Planta seleccionada info
  const selectedPlantInfo = useMemo(() => {
    if (!zones?.zones || !localData.selectedPlant) return null;
    return zones.zones.find(zone => zone.id === parseInt(localData.selectedPlant));
  }, [zones, localData.selectedPlant]);

  /**
   * Manejar selección de planta
   */
  const handlePlantChange = async (plantId) => {
    setIsCalculating(true);
    
    setLocalData(prev => ({
      ...prev,
      selectedPlant: plantId,
      materialCalculations: {},
      materialSummary: {
        totalCost: 0,
        materials: {},
        warnings: []
      }
    }));

    // Recalcular materiales para piezas existentes
    if (localData.pieces.length > 0) {
      await recalculateAllMaterials(localData.pieces, plantId);
    }
    
    setIsCalculating(false);
  };

  /**
   * Recalcular materiales para todas las piezas
   */
  const recalculateAllMaterials = async (pieces, plantId) => {
    if (!plantId || pieces.length === 0) return;

    setIsCalculating(true);
    const calculations = {};
    const summary = {
      totalCost: 0,
      materials: {},
      warnings: []
    };

    try {
      for (const piece of pieces) {
        const materialData = await calculatePieceMaterials(piece.piece_id, plantId, piece.quantity);
        calculations[piece.piece_id] = materialData;
        
        // Agregar al resumen
        if (materialData && !materialData.error) {
          summary.totalCost += materialData.totalCost || 0;
          
          // Agrupar materiales
          materialData.materials?.forEach(material => {
            const key = material.materialId;
            if (!summary.materials[key]) {
              summary.materials[key] = {
                ...material,
                totalQuantity: 0,
                totalCost: 0
              };
            }
            summary.materials[key].totalQuantity += material.quantity;
            summary.materials[key].totalCost += material.cost;
          });

          // Agregar warnings
          if (materialData.hasInsufficientMaterials) {
            summary.warnings.push(`Stock insuficiente para ${piece.piece_name}`);
          }
          if (materialData.hasLowStockMaterials) {
            summary.warnings.push(`Stock bajo para ${piece.piece_name}`);
          }
        }
      }

      setLocalData(prev => ({
        ...prev,
        materialCalculations: calculations,
        materialSummary: summary
      }));

      // Notificar warnings
      if (summary.warnings.length > 0) {
        warning(`${summary.warnings.length} advertencia(s) de stock detectadas`);
      }

    } catch (err) {
      console.error('Error recalculating materials:', err);
      error('Error al recalcular materiales');
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Calcular materiales para una pieza específica
   */
  const calculatePieceMaterials = async (pieceId, plantId, quantity) => {
    try {
      const response = await materialService.calculatePieceMaterialCost(pieceId, plantId, quantity);
      return response.data || response;
    } catch (err) {
      console.error(`Error calculating materials for piece ${pieceId}:`, err);
      return { error: 'Error al calcular materiales' };
    }
  };

  /**
   * Agregar pieza al presupuesto
   */
  const handleAddPiece = async (piece) => {
    if (!localData.selectedPlant) {
      error('Seleccione una planta primero');
      return;
    }

    const existingIndex = localData.pieces.findIndex(p => p.piece_id === piece.id);
    
    if (existingIndex >= 0) {
      // Incrementar cantidad
      const updatedPieces = [...localData.pieces];
      updatedPieces[existingIndex].quantity += 1;
      
      setLocalData(prev => ({ ...prev, pieces: updatedPieces }));
      
      // Recalcular materiales para esta pieza
      await updatePieceMaterials(piece.id, updatedPieces[existingIndex].quantity);
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

      const updatedPieces = [...localData.pieces, newPiece];
      setLocalData(prev => ({ ...prev, pieces: updatedPieces }));
      
      // Calcular materiales para la nueva pieza
      await updatePieceMaterials(piece.id, 1);
    }

    success(`${piece.name} agregada al presupuesto`);
  };

  /**
   * Actualizar materiales de una pieza específica
   */
  const updatePieceMaterials = async (pieceId, quantity) => {
    if (!localData.selectedPlant) return;

    setIsCalculating(true);
    
    try {
      const materialData = await calculatePieceMaterials(pieceId, localData.selectedPlant, quantity);
      
      setLocalData(prev => ({
        ...prev,
        materialCalculations: {
          ...prev.materialCalculations,
          [pieceId]: materialData
        }
      }));

      // Recalcular resumen completo
      setTimeout(() => {
        recalculateAllMaterials(localData.pieces, localData.selectedPlant);
      }, 100);

    } catch (err) {
      console.error('Error updating piece materials:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Remover pieza del presupuesto
   */
  const handleRemovePiece = (index) => {
    const removedPiece = localData.pieces[index];
    const updatedPieces = localData.pieces.filter((_, i) => i !== index);
    
    setLocalData(prev => {
      const newCalculations = { ...prev.materialCalculations };
      delete newCalculations[removedPiece.piece_id];
      
      return {
        ...prev,
        pieces: updatedPieces,
        materialCalculations: newCalculations
      };
    });

    // Recalcular resumen
    if (updatedPieces.length > 0) {
      setTimeout(() => {
        recalculateAllMaterials(updatedPieces, localData.selectedPlant);
      }, 100);
    } else {
      setLocalData(prev => ({
        ...prev,
        materialSummary: {
          totalCost: 0,
          materials: {},
          warnings: []
        }
      }));
    }

    success(`${removedPiece.piece_name} removida del presupuesto`);
  };

  /**
   * Actualizar cantidad de pieza
   */
  const handleUpdatePiece = async (index, field, value) => {
    const updatedPieces = [...localData.pieces];
    updatedPieces[index][field] = value;
    
    setLocalData(prev => ({ ...prev, pieces: updatedPieces }));

    // Si cambió la cantidad, recalcular materiales
    if (field === 'quantity' && value > 0) {
      await updatePieceMaterials(updatedPieces[index].piece_id, value);
    }
  };

  /**
   * Toggle detalles de materiales
   */
  const toggleMaterialDetails = (pieceId) => {
    setShowMaterialDetails(prev => ({
      ...prev,
      [pieceId]: !prev[pieceId]
    }));
  };

  /**
   * Toggle expansión de pieza
   */
  const togglePieceExpansion = (pieceId) => {
    setExpandedPieces(prev => ({
      ...prev,
      [pieceId]: !prev[pieceId]
    }));
  };

  /**
   * Renderizar indicador de estado de materiales
   */
  const renderMaterialStatus = (pieceId) => {
    const calculation = localData.materialCalculations[pieceId];
    
    if (!calculation) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Package className="w-4 h-4" />
          <span className="text-xs">Sin calcular</span>
        </div>
      );
    }

    if (calculation.error) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">Error</span>
        </div>
      );
    }

    const hasIssues = calculation.hasInsufficientMaterials || calculation.hasLowStockMaterials;
    
    return (
      <div className={`flex items-center gap-1 ${hasIssues ? 'text-amber-500' : 'text-green-500'}`}>
        {hasIssues ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        <span className="text-xs">
          ${calculation.totalCost?.toLocaleString() || '0'}
        </span>
      </div>
    );
  };

  /**
   * Renderizar detalles de materiales
   */
  const renderMaterialDetails = (pieceId) => {
    const calculation = localData.materialCalculations[pieceId];
    
    if (!calculation || calculation.error) {
      return (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {calculation?.error || 'No se pudieron calcular los materiales'}
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h6 className="font-medium text-gray-900 mb-2">Materiales necesarios:</h6>
        <div className="space-y-2">
          {calculation.materials?.map((material, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  material.sufficient ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-gray-700">
                  {material.name} ({material.unit})
                </span>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {material.quantity.toFixed(2)} {material.unit}
                </div>
                <div className="text-xs text-gray-500">
                  Stock: {material.availableStock.toFixed(2)}
                </div>
                <div className="text-xs font-medium text-gray-900">
                  ${material.cost.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {(calculation.hasInsufficientMaterials || calculation.hasLowStockMaterials) && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-800">
                {calculation.hasInsufficientMaterials ? 'Stock insuficiente' : 'Stock bajo'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Piezas y Cantidades</h3>
          <p className="text-sm text-gray-600">
            Selecciona la planta y las piezas necesarias para el proyecto
          </p>
        </div>
        
        {isCalculating && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Calculando materiales...</span>
          </div>
        )}
      </div>

      {/* Selección de Planta */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Factory className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Planta de Fabricación</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar planta *
            </label>
            <select
              value={localData.selectedPlant}
              onChange={(e) => handlePlantChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione una planta...</option>
              {zones?.zones?.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} - {zone.code}
                </option>
              ))}
            </select>
            
            {errors.selectedPlant && (
              <p className="mt-1 text-sm text-red-600">{errors.selectedPlant}</p>
            )}
          </div>
          
          {selectedPlantInfo && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Planta Seleccionada</h5>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Nombre:</strong> {selectedPlantInfo.name}</p>
                <p><strong>Código:</strong> {selectedPlantInfo.code}</p>
                {selectedPlantInfo.description && (
                  <p><strong>Descripción:</strong> {selectedPlantInfo.description}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Catálogo de Piezas */}
      {localData.selectedPlant && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Búsqueda y Catálogo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Catálogo de Piezas</h4>
            </div>

            {/* Filtros de búsqueda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

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

            {/* Lista de Piezas */}
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              {loadingPieces ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Cargando piezas...
                </div>
              ) : filteredPieces.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No se encontraron piezas</p>
                  <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPieces.map(piece => (
                    <div
                      key={piece.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
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
                            <span>Precio: ${piece.unit_price?.toLocaleString() || 'N/D'}</span>
                            {piece.weight && <span>Peso: {piece.weight} kg</span>}
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                              {piece.category}
                            </span>
                          </div>
                        </div>
                        <button className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Piezas Seleccionadas</h4>
                {localData.pieces.length > 0 && (
                  <span className="text-sm text-gray-500">({localData.pieces.length})</span>
                )}
              </div>
              
              {localData.materialSummary.totalCost > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Costo total materiales:</p>
                  <p className="font-semibold text-green-600">
                    ${localData.materialSummary.totalCost.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {errors.pieces && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.pieces}
                </p>
              </div>
            )}

            {/* Warnings de materiales */}
            {localData.materialSummary.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-amber-800">Advertencias de Stock</span>
                </div>
                <ul className="space-y-1">
                  {localData.materialSummary.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-amber-700">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lista de Piezas Seleccionadas */}
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              {localData.pieces.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay piezas seleccionadas</p>
                  <p className="text-sm">Selecciona piezas del catálogo</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {localData.pieces.map((selectedPiece, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-gray-900">
                              {selectedPiece.piece_name}
                            </h5>
                            <button
                              onClick={() => togglePieceExpansion(selectedPiece.piece_id)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            Código: {selectedPiece.piece_code}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Cantidad:</label>
                              <input
                                type="number"
                                min="1"
                                value={selectedPiece.quantity}
                                onChange={(e) => handleUpdatePiece(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                ${(selectedPiece.unit_price * selectedPiece.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Estado de materiales */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              {renderMaterialStatus(selectedPiece.piece_id)}
                              <button
                                onClick={() => toggleMaterialDetails(selectedPiece.piece_id)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                {showMaterialDetails[selectedPiece.piece_id] ? 'Ocultar' : 'Ver'} materiales
                              </button>
                            </div>
                          </div>

                          {/* Detalles de materiales expandidos */}
                          {showMaterialDetails[selectedPiece.piece_id] && (
                            renderMaterialDetails(selectedPiece.piece_id)
                          )}
                        </div>

                        <button
                          onClick={() => handleRemovePiece(index)}
                          className="ml-3 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumen de Materiales */}
      {Object.keys(localData.materialSummary.materials).length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h4 className="font-medium text-gray-900">Resumen de Materiales</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(localData.materialSummary.materials).map((material, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h6 className="font-medium text-gray-900">{material.name}</h6>
                  <span className={`w-2 h-2 rounded-full ${
                    material.sufficient ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Cantidad total: {material.totalQuantity.toFixed(2)} {material.unit}</p>
                  <p>Stock disponible: {material.availableStock.toFixed(2)} {material.unit}</p>
                  <p className="font-medium text-gray-900">
                    Costo total: ${material.totalCost.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Costo Total de Materiales:</span>
              <span className="text-lg font-bold text-green-600">
                ${localData.materialSummary.totalCost.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notas adicionales */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas adicionales
        </label>
        <textarea
          value={localData.notes}
          onChange={(e) => setLocalData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Agregar notas sobre las piezas seleccionadas o consideraciones especiales..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default EtapaPiezasCantidadesAvanzada;
