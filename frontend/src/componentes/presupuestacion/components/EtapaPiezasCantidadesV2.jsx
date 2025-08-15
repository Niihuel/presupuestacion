/**
 * Etapa 2 del Wizard - Piezas y Cantidades con TVF v2
 * 
 * Integra cálculo de precio UM con desglose completo:
 * - Materiales + Proceso + MO
 * - Comparación con mes anterior
 * - Warnings para datos faltantes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, Plus, Trash2, AlertCircle, Search, Calculator, Weight, 
  Factory, TrendingUp, TrendingDown, Info, Loader2, AlertTriangle,
  Eye, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { pieceService, zoneService } from '@compartido/servicios';
import { useNotifications } from '@compartido/hooks/useNotificaciones';

const EtapaPiezasCantidadesV2 = ({ data, onChange, errors = {} }) => {
  const [localData, setLocalData] = useState({
    pieces: [],
    notes: '',
    production_zone_id: data?.production_zone_id || '',
    effective_date: data?.effective_date || new Date().toISOString().split('T')[0],
    ...data
  });

  // Cache de precios calculados con desglose
  const priceCalculationCache = useRef(new Map()); // key: `${pieceId}_${zoneId}_${date}` => calculation
  const { warning, info, success } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [calculatingPrices, setCalculatingPrices] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Query para obtener piezas disponibles
  const { data: pieces, isLoading: loadingPieces } = useQuery({
    queryKey: ['pieces'],
    queryFn: () => pieceService.getPieces(),
    staleTime: 10 * 60 * 1000,
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

  // Filtrar piezas
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
  });

  const categories = [...new Set(piecesArray.map(piece => piece.category).filter(Boolean))];

  // Cálculo de medida total según UM
  const calculateMedTotal = (p) => {
    const qty = Number(p.quantity || 0);
    const len = Number(p.length || 0);
    const wid = Number(p.width || 0);
    const um = p.um || 'UND';
    
    if (um === 'M2') return qty * len * wid;
    if (um === 'MT') return qty * len;
    return qty; // UND
  };

  // Cálculo de peso total
  const calculatePesoTotal = (p) => {
    const med = Number(p.med_total || 0);
    const pesoPorUM_tn = Number(p.peso_tn_por_um || 0);
    
    if (pesoPorUM_tn > 0) {
      return med * pesoPorUM_tn * 1000; // tn -> kg
    }
    
    // Fallback: peso unitario * cantidad
    return Number(p.quantity || 0) * Number(p.weight || 0);
  };

  // Cálculo de precio usando TVF v2
  const calculatePiecePrice = async (pieceId, zoneId, effectiveDate, includeComparison = true) => {
    if (!zoneId) return null;
    
    const cacheKey = `${pieceId}_${zoneId}_${effectiveDate}`;
    const cached = priceCalculationCache.current.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await pieceService.calculatePiecePrice(
        pieceId,
        zoneId,
        effectiveDate,
        includeComparison
      );

      if (result?.success && result.data) {
        priceCalculationCache.current.set(cacheKey, result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error calculating piece price:', error);
      return null;
    }
  };

  // Refrescar precios para todas las piezas
  const refreshAllPricesForZone = async (zoneId, currentPieces) => {
    if (!zoneId) {
      warning('Seleccione una zona de producción para calcular precios', 'Zona requerida');
      return;
    }

    setCalculatingPrices(true);
    const effectiveDate = localData.effective_date || new Date().toISOString().split('T')[0];
    
    const updated = await Promise.all((currentPieces || localData.pieces).map(async (p) => {
      const calculation = await calculatePiecePrice(p.piece_id, zoneId, effectiveDate, true);
      
      let unitPrice = 0;
      let priceBreakdown = null;
      let comparison = null;
      let warnings = [];
      
      if (calculation) {
        unitPrice = calculation.breakdown?.total || 0;
        priceBreakdown = calculation.breakdown;
        comparison = calculation.comparison;
        warnings = calculation.warnings || [];
      }

      const np = { 
        ...p, 
        unit_price: unitPrice,
        price_breakdown: priceBreakdown,
        price_comparison: comparison,
        price_warnings: warnings
      };
      
      np.med_total = calculateMedTotal(np);
      np.peso_total = calculatePesoTotal(np);
      np.total_basico = np.med_total * unitPrice;
      np.total_final = np.total_basico * (np.price_adjustment || 1);
      np.no_price = !!zoneId && (!unitPrice || unitPrice <= 0);
      
      return np;
    }));

    setLocalData(prev => ({ ...prev, production_zone_id: zoneId, pieces: updated }));
    setCalculatingPrices(false);

    // Mostrar resumen de warnings
    const piecesWithWarnings = updated.filter(p => p.price_warnings?.length > 0);
    const piecesNoPrice = updated.filter(p => p.no_price);
    
    if (piecesNoPrice.length > 0) {
      warning(
        `${piecesNoPrice.length} pieza(s) no tienen precio calculado. Verifique datos técnicos y precios de materiales.`,
        'Precios incompletos'
      );
    } else if (piecesWithWarnings.length > 0) {
      warning(
        `${piecesWithWarnings.length} pieza(s) tienen advertencias en el cálculo.`,
        'Advertencias de cálculo'
      );
    } else {
      success(
        `Precios actualizados para ${updated.length} pieza(s) con desglose completo.`,
        'Cálculo exitoso'
      );
    }
  };

  // Agregar pieza con cálculo de precio
  const handleAddPiece = async (piece) => {
    const existingIndex = localData.pieces.findIndex(p => p.piece_id === piece.id);
    
    if (existingIndex >= 0) {
      const updatedPieces = [...localData.pieces];
      updatedPieces[existingIndex].quantity += 1;
      updatedPieces[existingIndex].med_total = calculateMedTotal(updatedPieces[existingIndex]);
      updatedPieces[existingIndex].peso_total = calculatePesoTotal(updatedPieces[existingIndex]);
      updatedPieces[existingIndex].total_basico = updatedPieces[existingIndex].med_total * updatedPieces[existingIndex].unit_price;
      updatedPieces[existingIndex].total_final = updatedPieces[existingIndex].total_basico * (updatedPieces[existingIndex].price_adjustment || 1);
      
      setLocalData(prev => ({
        ...prev,
        pieces: updatedPieces
      }));
    } else {
      const newPiece = {
        piece_id: piece.id,
        piece_code: piece.code,
        piece_name: piece.name,
        quantity: 1,
        unit_price: 0,
        weight: piece.weight || 0,
        length: piece.length || 0,
        width: piece.width || 0,
        thickness: piece.thickness || 0,
        um: piece.um || piece.unit_code || 'UND',
        categoria_ajuste: piece.categoria_ajuste || 'GENERAL',
        peso_tn_por_um: piece.peso_tn_por_um || 0,
        kg_acero_por_um: piece.kg_acero_por_um || 0,
        volumen_m3_por_um: piece.volumen_m3_por_um || 0,
        tc_type: 'NO',
        orientation: '',
        med_total: 0,
        peso_total: 0,
        price_adjustment: 1.0,
        total_basico: 0,
        total_final: 0,
        category: piece.category,
        description: piece.description || '',
        price_breakdown: null,
        price_comparison: null,
        price_warnings: []
      };

      // Calcular precio si hay zona seleccionada
      if (localData.production_zone_id) {
        const effectiveDate = localData.effective_date || new Date().toISOString().split('T')[0];
        const calculation = await calculatePiecePrice(piece.id, localData.production_zone_id, effectiveDate, true);
        
        if (calculation) {
          newPiece.unit_price = calculation.breakdown?.total || 0;
          newPiece.price_breakdown = calculation.breakdown;
          newPiece.price_comparison = calculation.comparison;
          newPiece.price_warnings = calculation.warnings || [];
          newPiece.no_price = !newPiece.unit_price || newPiece.unit_price <= 0;
        }
      }

      newPiece.med_total = calculateMedTotal(newPiece);
      newPiece.peso_total = calculatePesoTotal(newPiece);
      newPiece.total_basico = newPiece.med_total * newPiece.unit_price;
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
      [field]: ['quantity','unit_price','weight','length','width','thickness','price_adjustment'].includes(field) 
        ? (parseFloat(value) || 0) 
        : value
    };

    // Recalcular totales
    updatedPieces[index].med_total = calculateMedTotal(updatedPieces[index]);
    updatedPieces[index].peso_total = calculatePesoTotal(updatedPieces[index]);
    updatedPieces[index].total_basico = updatedPieces[index].med_total * updatedPieces[index].unit_price;
    updatedPieces[index].total_final = updatedPieces[index].total_basico * (updatedPieces[index].price_adjustment || 1);

    setLocalData(prev => ({
      ...prev,
      pieces: updatedPieces
    }));
  };

  const toggleRowExpansion = (pieceId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pieceId)) {
        newSet.delete(pieceId);
      } else {
        newSet.add(pieceId);
      }
      return newSet;
    });
  };

  // Calcular totales
  const totals = localData.pieces.reduce((acc, piece) => ({
    peso: acc.peso + (piece.peso_total || 0),
    basico: acc.basico + (piece.total_basico || 0),
    final: acc.final + (piece.total_final || 0)
  }), { peso: 0, basico: 0, final: 0 });

  return (
    <div className="space-y-6">
      {/* Controles de zona y fecha */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Factory className="h-5 w-5 text-blue-600" />
            Configuración de Producción
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zona de Producción *
            </label>
            <select
              value={localData.production_zone_id || ''}
              onChange={(e) => {
                const newZoneId = e.target.value;
                setLocalData(prev => ({ ...prev, production_zone_id: newZoneId }));
                if (newZoneId && localData.pieces.length > 0) {
                  refreshAllPricesForZone(newZoneId, localData.pieces);
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.production_zone_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar zona...</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
            {errors.production_zone_id && (
              <p className="mt-1 text-sm text-red-500">{errors.production_zone_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Efectiva
            </label>
            <input
              type="date"
              value={localData.effective_date || ''}
              onChange={(e) => {
                setLocalData(prev => ({ ...prev, effective_date: e.target.value }));
                // Limpiar cache de precios al cambiar fecha
                priceCalculationCache.current.clear();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => refreshAllPricesForZone(localData.production_zone_id, localData.pieces)}
              disabled={!localData.production_zone_id || localData.pieces.length === 0 || calculatingPrices}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {calculatingPrices ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  Recalcular Precios
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Selector de piezas */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Seleccionar Piezas
          </h3>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar piezas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Lista de piezas disponibles */}
        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
          {loadingPieces ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Cargando piezas...</p>
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
                  className="p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                  onClick={() => handleAddPiece(piece)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{piece.name}</div>
                    <div className="text-sm text-gray-500">
                      Código: {piece.code} | UM: {piece.um || piece.unit_code || 'UND'}
                    </div>
                  </div>
                  <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de piezas seleccionadas */}
      {localData.pieces.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Piezas del Presupuesto ({localData.pieces.length})
            </h3>
            {calculatingPrices && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Calculando precios...</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pieza</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dimensiones</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Med. Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Precio/UM</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {localData.pieces.map((piece, index) => {
                  const isExpanded = expandedRows.has(piece.piece_id);
                  
                  return (
                    <React.Fragment key={`${piece.piece_id}-${index}`}>
                      <tr className={piece.no_price ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{piece.piece_name}</div>
                            <div className="text-xs text-gray-500">
                              {piece.piece_code} | {piece.um}
                              {piece.categoria_ajuste === 'ESPECIAL' && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                  Especial
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={piece.quantity}
                            onChange={(e) => handleUpdatePiece(index, 'quantity', e.target.value)}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {piece.um === 'M2' && (
                            <div className="flex gap-2 justify-center">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="L"
                                value={piece.length}
                                onChange={(e) => handleUpdatePiece(index, 'length', e.target.value)}
                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                              />
                              <span>×</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="A"
                                value={piece.width}
                                onChange={(e) => handleUpdatePiece(index, 'width', e.target.value)}
                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                              />
                            </div>
                          )}
                          {piece.um === 'MT' && (
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Largo"
                              value={piece.length}
                              onChange={(e) => handleUpdatePiece(index, 'length', e.target.value)}
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                            />
                          )}
                          {piece.um === 'UND' && '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-medium">
                            {piece.med_total?.toFixed(2)} {piece.um}
                          </div>
                          <div className="text-xs text-gray-500">
                            {piece.peso_total?.toFixed(0)} kg
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={piece.unit_price}
                              onChange={(e) => handleUpdatePiece(index, 'unit_price', e.target.value)}
                              className="w-24 px-2 py-1 text-center border border-gray-300 rounded"
                            />
                            {piece.price_comparison && (
                              <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                                piece.price_comparison.trend === 'up' ? 'text-red-600' :
                                piece.price_comparison.trend === 'down' ? 'text-green-600' :
                                'text-gray-600'
                              }`}>
                                {piece.price_comparison.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                                {piece.price_comparison.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                                {piece.price_comparison.delta_percent > 0 ? '+' : ''}
                                {piece.price_comparison.delta_percent?.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            ${piece.total_final?.toFixed(2)}
                          </div>
                          {piece.price_adjustment !== 1 && (
                            <div className="text-xs text-gray-500">
                              Ajuste: {((piece.price_adjustment - 1) * 100).toFixed(0)}%
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {piece.no_price ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Sin precio
                            </span>
                          ) : piece.price_warnings?.length > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Warnings
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              OK
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => toggleRowExpansion(piece.piece_id)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Ver desglose"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRemovePiece(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandida con desglose */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" className="px-4 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Desglose de costos */}
                              {piece.price_breakdown && (
                                <div className="bg-white rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    Desglose de Costos
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Materiales:</span>
                                      <span className="font-medium">${piece.price_breakdown.materiales?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Proceso/tn:</span>
                                      <span className="font-medium">${piece.price_breakdown.proceso_por_tn?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">MO Hormigón:</span>
                                      <span className="font-medium">${piece.price_breakdown.mano_obra_hormigon?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">MO Acero:</span>
                                      <span className="font-medium">${piece.price_breakdown.mano_obra_acero?.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-1 mt-1">
                                      <div className="flex justify-between font-semibold">
                                        <span>Total:</span>
                                        <span className="text-blue-600">${piece.price_breakdown.total?.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Warnings y datos técnicos */}
                              <div className="space-y-3">
                                {piece.price_warnings?.length > 0 && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-yellow-900 mb-1">Advertencias</h4>
                                    <ul className="text-xs text-yellow-800 space-y-1">
                                      {piece.price_warnings.map((warning, idx) => (
                                        <li key={idx}>• {warning}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="bg-white rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Datos Técnicos</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">Peso/UM:</span>
                                      <span className="ml-1 font-medium">{piece.peso_tn_por_um?.toFixed(4)} tn</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Acero/UM:</span>
                                      <span className="ml-1 font-medium">{piece.kg_acero_por_um?.toFixed(2)} kg</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Hormigón/UM:</span>
                                      <span className="ml-1 font-medium">{piece.volumen_m3_por_um?.toFixed(4)} m³</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-medium">Totales:</td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm font-medium">{totals.peso.toFixed(0)} kg</div>
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-base font-bold text-blue-600">
                      ${totals.final.toFixed(2)}
                    </div>
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Notas adicionales */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas adicionales (opcional)
        </label>
        <textarea
          value={localData.notes}
          onChange={(e) => setLocalData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Agregar notas o comentarios..."
        />
      </div>

      {/* Resumen de validación */}
      {errors.pieces && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Errores de validación</p>
              <p className="text-sm text-red-600 mt-1">{errors.pieces}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EtapaPiezasCantidadesV2;