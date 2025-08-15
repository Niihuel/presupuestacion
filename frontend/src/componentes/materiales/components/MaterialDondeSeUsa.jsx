/**
 * Componente Where-Used para Materiales
 * 
 * Muestra análisis de impacto BOM:
 * - Piezas que usan el material
 * - Consumo efectivo y costo aportado
 * - % participación en costo total
 * - Acciones rápidas para editar BOM y publicar precios
 */

import { useState, useEffect } from 'react';
import { 
  Search, Package, TrendingUp, TrendingDown, AlertCircle, 
  Calculator, Edit, Upload, RefreshCw, Loader2, Info,
  DollarSign, Percent, Weight, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { materialService } from '@compartido/servicios';
import { pieceService } from '@compartido/servicios';
import { useZones } from '@compartido/hooks/useZonesHook';

function MaterialWhereUsed({ material, isOpen, onClose }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [whereUsedData, setWhereUsedData] = useState(null);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const [impactAnalysis, setImpactAnalysis] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [publishingPieces, setPublishingPieces] = useState(new Set());
  
  const { data: zonesData } = useZones();
  const zones = zonesData?.zones || [];

  // Cargar análisis Where-Used
  const loadWhereUsed = async () => {
    if (!selectedZone || !material?.id) return;
    
    setLoading(true);
    try {
      const monthDate = `${selectedMonth}-01`;
      const response = await materialService.getWhereUsed(
        material.id,
        selectedZone,
        monthDate
      );
      
      if (response?.success && response.data) {
        setWhereUsedData(response.data);
      }
    } catch (error) {
      console.error('Error loading where-used:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recalcular impacto de cambio de precio
  const recalculateImpact = async () => {
    if (!selectedZone || !material?.id) return;
    
    setRecalculateLoading(true);
    try {
      const monthDate = `${selectedMonth}-01`;
      const response = await materialService.recalculateImpact(
        material.id,
        selectedZone,
        monthDate
      );
      
      if (response?.success && response.data) {
        setImpactAnalysis(response.data);
      }
    } catch (error) {
      console.error('Error recalculating impact:', error);
    } finally {
      setRecalculateLoading(false);
    }
  };

  // Publicar precio de pieza
  const publishPiecePrice = async (pieceId, newPrice) => {
    setPublishingPieces(prev => new Set([...prev, pieceId]));
    
    try {
      const monthDate = `${selectedMonth}-01`;
      const response = await pieceService.publishPiecePrice(pieceId, {
        zone_id: selectedZone,
        effective_date: monthDate,
        price: newPrice
      });
      
      if (response?.success) {
        // Recargar where-used para ver cambios
        await loadWhereUsed();
      }
    } catch (error) {
      console.error('Error publishing piece price:', error);
      alert('Error al publicar precio: ' + error.message);
    } finally {
      setPublishingPieces(prev => {
        const newSet = new Set(prev);
        newSet.delete(pieceId);
        return newSet;
      });
    }
  };

  // Calcular precio actualizado de pieza
  const calculatePiecePrice = async (pieceId) => {
    try {
      const monthDate = `${selectedMonth}-01`;
      const response = await pieceService.calculatePiecePrice(
        pieceId,
        selectedZone,
        monthDate,
        true // compare
      );
      
      if (response?.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Error calculating piece price:', error);
      return null;
    }
  };

  // Toggle fila expandida
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

  useEffect(() => {
    if (isOpen && material && selectedZone) {
      loadWhereUsed();
    }
  }, [isOpen, material, selectedZone, selectedMonth]);

  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Search className="h-6 w-6 text-purple-600" />
                Análisis Where-Used / Factor Fundamental
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Material: <span className="font-medium">{material.name}</span> ({material.code})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <span className="text-gray-500">✕</span>
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona
              </label>
              <select
                value={selectedZone || ''}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccionar zona...</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mes
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={loadWhereUsed}
              disabled={!selectedZone || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </button>

            <button
              onClick={recalculateImpact}
              disabled={!whereUsedData || recalculateLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {recalculateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Recalcular Impacto
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto max-h-[calc(90vh-16rem)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : whereUsedData ? (
            <div className="p-6 space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Piezas afectadas</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {whereUsedData.total_pieces}
                  </p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Impacto total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${whereUsedData.total_impact?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Weight className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Precio material</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${whereUsedData.material_price?.toFixed(2) || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">por {material.unit}</p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Percent className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Participación promedio</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(whereUsedData.affected_pieces?.reduce((sum, p) => 
                      sum + (p.participation_percent || 0), 0
                    ) / (whereUsedData.total_pieces || 1)).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Análisis de impacto (si está disponible) */}
              {impactAnalysis && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-900 mb-2">
                        Análisis de Impacto por Cambio de Precio
                      </h4>
                      <div className="text-sm text-yellow-800 space-y-1">
                        <p>• Piezas afectadas: {impactAnalysis.affected_pieces}</p>
                        <p>• Impacto total estimado: ${impactAnalysis.total_impact?.toFixed(2)}</p>
                        <p>• Actualizado al: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de piezas afectadas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Piezas que usan este material
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Pieza
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          UM
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Cantidad/UM
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Desperdicio %
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Consumo Efectivo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Costo Aportado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          % Participación
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Precio Publicado
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {whereUsedData.affected_pieces?.map((piece) => {
                        const isExpanded = expandedRows.has(piece.piece_id);
                        const isPublishing = publishingPieces.has(piece.piece_id);
                        
                        return (
                          <>
                            <tr key={piece.piece_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {piece.piece_name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {piece.piece_code}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {piece.unit_code}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {piece.quantity_per_unit?.toFixed(4)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {((piece.waste_factor || 0) * 100).toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                {piece.effective_consumption?.toFixed(4)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                                ${piece.contributed_cost?.toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-purple-600 h-2 rounded-full"
                                      style={{ width: `${Math.min(piece.participation_percent || 0, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {piece.participation_percent?.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                {piece.published_price ? (
                                  <span className="font-medium text-gray-900">
                                    ${piece.published_price.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => toggleRowExpansion(piece.piece_id)}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    title="Ver detalles"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                  
                                  <button
                                    onClick={() => window.open(`/pieces/${piece.piece_id}/edit`, '_blank')}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Editar BOM"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  
                                  <button
                                    onClick={async () => {
                                      const priceData = await calculatePiecePrice(piece.piece_id);
                                      if (priceData?.breakdown?.total) {
                                        await publishPiecePrice(piece.piece_id, priceData.breakdown.total);
                                      }
                                    }}
                                    disabled={isPublishing}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                    title="Publicar precio actualizado"
                                  >
                                    {isPublishing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Upload className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Fila expandida con detalles */}
                            {isExpanded && (
                              <tr>
                                <td colSpan="9" className="px-4 py-4 bg-gray-50">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg p-3">
                                      <p className="text-xs text-gray-500 mb-1">Costo total materiales</p>
                                      <p className="text-lg font-semibold text-gray-900">
                                        ${piece.total_material_cost?.toFixed(2)}
                                      </p>
                                    </div>
                                    
                                    {impactAnalysis?.price_updates?.find(u => u.piece_id === piece.piece_id) && (
                                      <>
                                        <div className="bg-white rounded-lg p-3">
                                          <p className="text-xs text-gray-500 mb-1">Nuevo precio estimado</p>
                                          <p className="text-lg font-semibold text-blue-600">
                                            ${impactAnalysis.price_updates.find(u => u.piece_id === piece.piece_id).new_price?.toFixed(2)}
                                          </p>
                                        </div>
                                        
                                        <div className="bg-white rounded-lg p-3">
                                          <p className="text-xs text-gray-500 mb-1">Variación</p>
                                          <div className="flex items-center gap-2">
                                            {impactAnalysis.price_updates.find(u => u.piece_id === piece.piece_id).delta > 0 ? (
                                              <TrendingUp className="h-5 w-5 text-red-500" />
                                            ) : (
                                              <TrendingDown className="h-5 w-5 text-green-500" />
                                            )}
                                            <p className={`text-lg font-semibold ${
                                              impactAnalysis.price_updates.find(u => u.piece_id === piece.piece_id).delta > 0 
                                                ? 'text-red-600' 
                                                : 'text-green-600'
                                            }`}>
                                              {impactAnalysis.price_updates.find(u => u.piece_id === piece.piece_id).delta_percent?.toFixed(2)}%
                                            </p>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : selectedZone ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">No se encontraron piezas que usen este material</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Info className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">Seleccione una zona para buscar</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {whereUsedData && (
              <span>
                Mostrando {whereUsedData.affected_pieces?.length || 0} piezas afectadas
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaterialWhereUsed;