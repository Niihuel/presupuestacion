/**
 * Componente para la segunda etapa del wizard: Piezas y Cantidades
 * 
 * Permite seleccionar piezas y definir cantidades para el presupuesto
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, Trash2, AlertCircle, Search, Calculator, Weight, Factory } from 'lucide-react';
import { pieceService, zoneService } from '@compartido/services';
import { useNotifications } from '@compartido/hooks/useNotifications';

const EtapaPiezasCantidades = ({ data, onChange, errors = {} }) => {
  const [localData, setLocalData] = useState({
    pieces: [],
    notes: '',
    production_zone_id: data?.production_zone_id || '',
    ...data
  });

  // cache precios por pieza/zona
  const priceCacheRef = React.useRef(new Map()); // key: `${pieceId}_${zoneId}` => price
  const { warning, info } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Query para obtener piezas disponibles
  const { data: pieces, isLoading: loadingPieces } = useQuery({
    queryKey: ['pieces'],
    queryFn: () => pieceService.getPieces(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const { data: zonesResp } = useQuery({
    queryKey: ['zones-active'],
    queryFn: () => zoneService.getActiveZones?.() || zoneService.getZones?.(),
    staleTime: 10 * 60 * 1000
  });
  const zones = zonesResp?.data || zonesResp?.zones || zonesResp || [];

  // Actualizar formData cuando localData cambie
  useEffect(() => {
    onChange(localData);
  }, [localData, onChange]);

  // Filtrar piezas por búsqueda y categoría
  const piecesArray = Array.isArray(pieces?.data)
    ? pieces.data
    : Array.isArray(pieces?.pieces)
      ? pieces.pieces
      : Array.isArray(pieces)
        ? pieces
        : [];

  const filteredPieces = piecesArray.filter(piece => {
    const matchesSearch = piece.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         piece.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || piece.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Obtener categorías únicas
  const categories = [...new Set(piecesArray.map(piece => piece.category).filter(Boolean))];

  const calculateMedTotal = (p) => {
    const qty = Number(p.quantity || 0);
    const len = Number(p.length || 0);
    const wid = Number(p.width || 0);
    const um = p.um || 'UND';
    if (um === 'M2') return qty * len * (wid || 0);
    if (um === 'MT') return qty * len;
    return qty; // UND
  };

  const calculatePesoTotal = (p) => {
    const med = Number(p.med_total || 0);
    const um = p.um || 'UND';
    const pesoPorUM_tn = Number(p.pesoPorUM_tn || 0);
    if (pesoPorUM_tn > 0) {
      // convertir tn -> kg para esta vista
      return med * pesoPorUM_tn * 1000;
    }
    // Fallback: kg/pieza para UND
    return (Number(p.quantity || 0)) * Number(p.weight || 0);
  };
  const getPiecePriceForZone = async (pieceId, zoneId) => {
    if (!zoneId) return 0;
    const key = `${pieceId}_${zoneId}`;
    const cache = priceCacheRef.current;
    if (cache.has(key)) return cache.get(key);
    try {
      const resp = await pieceService.getPiecePrices(pieceId);
      const list = resp?.data || resp?.prices || resp || [];
      const item = Array.isArray(list) ? list.find(p => String(p.zone_id) === String(zoneId)) : null;
      const price = item ? (Number(item.final_price ?? (item.base_price || 0)) + Number(item.adjustment || 0)) : 0;
      cache.set(key, price);
      return price;
    } catch (_) {
      return 0;
    }
  };

  const refreshAllPricesForZone = async (zoneId, currentPieces) => {
    const updated = await Promise.all((currentPieces || []).map(async (p) => {
      const unitPrice = await getPiecePriceForZone(p.piece_id, zoneId);
      const np = { ...p, unit_price: unitPrice };
      np.med_total = calculateMedTotal(np);
      np.peso_total = calculatePesoTotal(np);
      np.total_basico = calculateTotalBasico(np);
      np.total_final = np.total_basico * (np.price_adjustment || 1);
      np.no_price = !!zoneId && (!unitPrice || Number(unitPrice) <= 0);
      return np;
    }));
    setLocalData(prev => ({ ...prev, production_zone_id: zoneId, pieces: updated }));
    const countNoPrice = updated.filter(x => x.no_price).length;
    if (zoneId) {
      if (countNoPrice > 0) {
        warning(`${countNoPrice} pieza(s) no tienen precio para la planta seleccionada.`, 'Precios incompletos');
      } else {
        info(`Precios actualizados para ${updated.length} pieza(s).`, 'Precios actualizados');
      }
    }
  };

  const calculateTotalBasico = (p) => {
    return (p.med_total || 0) * (p.unit_price || 0);
  };

  const handleAddPiece = async (piece) => {
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
        unit_price: 0,
        weight: piece.weight || 0, // kg/pieza (fallback)
        length: piece.length || 0,
        width: piece.width || 0,
        thickness: piece.thickness || 0,
        um: piece.um || 'UND',
        categoriaAjuste: (piece.categoriaAjuste === 'ESPECIAL') ? 'ESPECIAL' : 'GENERAL',
        pesoPorUM_tn: piece.pesoPorUM_tn || 0,
        tc_type: 'NO',
        orientation: '',
        med_total: 0,
        peso_total: 0,
        price_adjustment: 1.0,
        total_basico: 0,
        total_final: 0,
        category: piece.category,
        description: piece.description || ''
      };
      // asignar precio por planta si está seleccionada
      if (localData.production_zone_id) {
        newPiece.unit_price = await getPiecePriceForZone(piece.id, localData.production_zone_id);
        newPiece.no_price = !newPiece.unit_price || Number(newPiece.unit_price) <= 0;
      } else {
        newPiece.no_price = false;
      }
      newPiece.med_total = calculateMedTotal(newPiece);
      newPiece.peso_total = calculatePesoTotal(newPiece);
      newPiece.total_basico = calculateTotalBasico(newPiece);
      newPiece.total_final = newPiece.total_basico * (newPiece.price_adjustment || 1);

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
      [field]: ['quantity','unit_price','weight','length','width','thickness','price_adjustment', 'pesoPorUM_tn']
                .includes(field) ? (parseFloat(value) || 0) : value
    };

    // Recalcular métricas clave
    const p = updatedPieces[index];
    p.med_total = calculateMedTotal(p);
    p.peso_total = calculatePesoTotal(p);
    p.total_basico = calculateTotalBasico(p);
    p.total_final = p.total_basico * (p.price_adjustment || 1);

    setLocalData(prev => ({
      ...prev,
      pieces: updatedPieces
    }));
  };

  // Calcular totales
  const calculateTotals = () => {
    return localData.pieces.reduce((acc, piece) => {
      const itemTotal = (piece.total_final ?? (piece.quantity * piece.unit_price)) || 0;
      const itemWeight = piece.peso_total || (piece.quantity * (piece.weight || 0));
      return {
        total: acc.total + itemTotal,
        weight: acc.weight + itemWeight,
        items: acc.items + (piece.quantity || 0)
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

      {/* Selector de Planta/Zona para precios */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Factory className="w-4 h-4 text-purple-600" /> Planta/Zona para precios
        </label>
        <select
          value={localData.production_zone_id || ''}
          onChange={(e) => refreshAllPricesForZone(e.target.value, localData.pieces)}
          className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccione una planta...</option>
          {Array.isArray(zones) && zones.map(z => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Se utilizará esta planta para obtener el precio unitario de cada pieza automáticamente.</p>
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
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-gray-900">{piece.piece_name}</h5>
                            {localData.production_zone_id && piece.no_price && (
                              <span className="px-2 py-0.5 text-xs rounded border border-red-200 bg-red-50 text-red-700">
                                Sin precio para esta planta
                              </span>
                            )}
                          </div>
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

                      {/* Precio Unitario (automático) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio Unit. (auto)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={piece.unit_price}
                          readOnly
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-600"
                        />
                      </div>

                      {/* Peso */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Peso (kg)
                        </label>
                      {/* Largo */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Largo (m)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={piece.length || 0}
                          onChange={(e) => handleUpdatePiece(index, 'length', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Ancho */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Ancho (m)
                        </label>
                      {/* Peso por UM (tn/UM) visible si la pieza lo usa */}
                      {piece.um !== 'UND' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Peso por UM (tn/UM)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={piece.pesoPorUM_tn || 0}
                            onChange={(e) => handleUpdatePiece(index, 'pesoPorUM_tn', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={piece.width || 0}
                          onChange={(e) => handleUpdatePiece(index, 'width', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Ajuste de precio */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Factor Ajuste
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={piece.price_adjustment || 1}
                          onChange={(e) => handleUpdatePiece(index, 'price_adjustment', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
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
                        Med. total: {(piece.med_total || 0).toLocaleString()} | Peso: {(piece.peso_total || 0).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="mt-1 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        Total: ${(piece.total_final || (piece.quantity * piece.unit_price)).toLocaleString()}
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
