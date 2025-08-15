/**
 * Componente para la segunda etapa del wizard: Piezas y Cantidades
 * 
 * Permite seleccionar piezas y definir cantidades para el presupuesto
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, Trash2, AlertCircle, Search, Calculator, Weight } from 'lucide-react';
import { pieceService } from '../../shared/services';

const EtapaPiezasCantidades = ({ formData, updateFormData, errors = {} }) => {
  const [localData, setLocalData] = useState({
    pieces: [],
    notes: '',
    ...formData
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Query para obtener piezas disponibles
  const { data: pieces, isLoading: loadingPieces } = useQuery({
    queryKey: ['pieces'],
    queryFn: () => pieceService.getPieces(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Actualizar formData cuando localData cambie
  useEffect(() => {
    updateFormData(localData);
  }, [localData, updateFormData]);

  // Filtrar piezas por búsqueda y categoría
  const filteredPieces = pieces?.data?.filter(piece => {
    const matchesSearch = piece.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         piece.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || piece.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Obtener categorías únicas
  const categories = [...new Set(pieces?.data?.map(piece => piece.category) || [])];

  const handleAddPiece = (piece) => {
    const existingIndex = localData.pieces.findIndex(p => p.piece_id === piece.id);
    
    if (existingIndex >= 0) {
      // Si ya existe, incrementar cantidad
      const updatedPieces = [...localData.pieces];
      updatedPieces[existingIndex].quantity += 1;
      
      setLocalData(prev => ({
        ...prev,
        pieces: updatedPieces
      }));
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

      setLocalData(prev => ({
        ...prev,
        pieces: [...prev.pieces, newPiece]
      }));
    }
  };

  const handleRemovePiece = (index) => {
    const updatedPieces = localData.pieces.filter((_, i) => i !== index);
    setLocalData(prev => ({
      ...prev,
      pieces: updatedPieces
    }));
  };

  const handleUpdatePiece = (index, field, value) => {
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
  };

  // Calcular totales
  const calculateTotals = () => {
    return localData.pieces.reduce((acc, piece) => {
      const itemTotal = piece.quantity * piece.unit_price;
      const itemWeight = piece.quantity * piece.weight;
      
      return {
        total: acc.total + itemTotal,
        weight: acc.weight + itemWeight,
        items: acc.items + piece.quantity
      };
    }, { total: 0, weight: 0, items: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Selección de Piezas y Cantidades
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Seleccione las piezas necesarias y defina las cantidades
        </p>
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
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Piezas Seleccionadas
            </h4>
            <span className="text-sm text-gray-600">
              {localData.pieces.length} tipos de piezas
            </span>
          </div>

          {errors.pieces && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.pieces}
              </p>
            </div>
          )}

          {/* Lista de Piezas Seleccionadas */}
          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            {localData.pieces.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay piezas seleccionadas</p>
                <p className="text-sm">Seleccione piezas del catálogo</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {localData.pieces.map((piece, index) => (
                  <div key={`${piece.piece_id}-${index}`} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-gray-900">{piece.piece_name}</h5>
                        <p className="text-sm text-gray-600">Código: {piece.piece_code}</p>
                      </div>
                      <button
                        onClick={() => handleRemovePiece(index)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Cantidad */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={piece.quantity}
                          onChange={(e) => handleUpdatePiece(index, 'quantity', e.target.value)}
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`pieces_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      {/* Precio Unitario */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio Unit.
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

                      {/* Peso */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={piece.weight}
                          onChange={(e) => handleUpdatePiece(index, 'weight', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Subtotal por pieza */}
                    <div className="mt-2 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        Subtotal: ${(piece.quantity * piece.unit_price).toLocaleString()}
                      </span>
                    </div>

                    {errors[`pieces_${index}_quantity`] && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors[`pieces_${index}_quantity`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          {localData.pieces.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-3">Resumen</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total de elementos:</span>
                  <span className="font-medium">{totals.items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Weight className="w-3 h-3" />
                    Peso total:
                  </span>
                  <span className="font-medium">{totals.weight.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between border-t border-blue-300 pt-2">
                  <span className="font-medium">Subtotal piezas:</span>
                  <span className="font-bold text-blue-900">
                    ${totals.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas sobre las piezas
            </label>
            <textarea
              value={localData.notes}
              onChange={(e) => setLocalData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Comentarios adicionales sobre las piezas seleccionadas..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtapaPiezasCantidades;
