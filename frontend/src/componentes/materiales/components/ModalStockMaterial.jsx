/**
 * Modal para gestionar stock de materiales por planta
 * 
 * Permite:
 * - Ver stock actual por planta
 * - Actualizar cantidades
 * - Registrar movimientos
 * - Alertas de stock bajo
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Package, 
  Factory,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { useUpdateMaterialStock, useMaterialStockByPlant } from '@compartido/hooks/useMaterialsHook';
import { useNotifications } from '@compartido/hooks/useNotificaciones';

const MaterialStockModal = ({ material, zones, onClose }) => {
  const [stockData, setStockData] = useState({});
  const [movements, setMovements] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: stockByPlant, isLoading } = useMaterialStockByPlant(material.id);
  const updateStock = useUpdateMaterialStock();
  const { showNotification } = useNotifications();

  // Inicializar datos de stock
  useEffect(() => {
    if (stockByPlant && zones) {
      const initialStock = {};
      const initialMovements = {};
      
      zones.forEach(zone => {
        const plantStock = stockByPlant.find(stock => stock.plantId === zone.id);
        initialStock[zone.id] = plantStock?.currentStock || 0;
        initialMovements[zone.id] = {
          type: 'adjustment',
          quantity: 0,
          reason: '',
          notes: ''
        };
      });
      
      setStockData(initialStock);
      setMovements(initialMovements);
    }
  }, [stockByPlant, zones]);

  const handleStockChange = (plantId, newStock) => {
    setStockData(prev => ({
      ...prev,
      [plantId]: Math.max(0, parseFloat(newStock) || 0)
    }));
  };

  const handleMovementChange = (plantId, field, value) => {
    setMovements(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        [field]: value
      }
    }));
  };

  const handleQuickAdjustment = (plantId, adjustment) => {
    const currentStock = stockData[plantId] || 0;
    const newStock = Math.max(0, currentStock + adjustment);
    handleStockChange(plantId, newStock);
    
    // Actualizar el movimiento
    setMovements(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        type: adjustment > 0 ? 'increase' : 'decrease',
        quantity: Math.abs(adjustment),
        reason: adjustment > 0 ? 'Ingreso de stock' : 'Consumo/Salida'
      }
    }));
  };

  const getStockStatus = (current, minimum) => {
    if (current === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (current <= minimum) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const updates = [];
      
      for (const [plantId, stock] of Object.entries(stockData)) {
        const movement = movements[plantId];
        if (movement.quantity > 0 || movement.reason) {
          updates.push({
            materialId: material.id,
            plantId,
            stockData: {
              currentStock: stock,
              movement: {
                ...movement,
                date: new Date().toISOString(),
                userId: 'current-user' // TODO: Get from auth context
              }
            }
          });
        }
      }

      // Ejecutar todas las actualizaciones
      await Promise.all(
        updates.map(update => updateStock.mutateAsync(update))
      );

      showNotification('Stock actualizado correctamente', 'success');
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      showNotification('Error al actualizar el stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center text-gray-600 mt-4">Cargando información de stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestionar Stock</h2>
              <p className="text-sm text-gray-600">{material.name} - {material.code}</p>
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
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <div className="space-y-6">
            {zones.map(zone => {
              const plantStock = stockByPlant?.find(stock => stock.plantId === zone.id);
              const currentStock = stockData[zone.id] || 0;
              const originalStock = plantStock?.currentStock || 0;
              const hasChanges = currentStock !== originalStock;
              const stockStatus = getStockStatus(currentStock, material.minStock || 0);

              return (
                <div key={zone.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Factory className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg font-medium text-gray-900">{zone.name}</h3>
                    </div>
                    
                    {/* Estado del stock */}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color} ${stockStatus.bg}`}>
                      {stockStatus.status === 'out' && 'Sin stock'}
                      {stockStatus.status === 'low' && 'Stock bajo'}
                      {stockStatus.status === 'good' && 'Stock normal'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stock actual */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Stock Actual</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cantidad ({material.unit})
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustment(zone.id, -10)}
                              className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            
                            <input
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) => handleStockChange(zone.id, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                            />
                            
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustment(zone.id, 10)}
                              className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {hasChanges && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              {currentStock > originalStock ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={currentStock > originalStock ? 'text-green-600' : 'text-red-600'}>
                                {currentStock > originalStock ? '+' : ''}{currentStock - originalStock} {material.unit}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Información adicional */}
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Stock original:</span>
                            <span className="font-medium">{originalStock} {material.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stock mínimo:</span>
                            <span className="font-medium">{material.minStock || 0} {material.unit}</span>
                          </div>
                          {plantStock?.lastMovement && (
                            <div className="flex justify-between">
                              <span>Último movimiento:</span>
                              <span className="font-medium">
                                {new Date(plantStock.lastMovement).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Registro de movimiento */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Registro de Movimiento</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de movimiento
                          </label>
                          <select
                            value={movements[zone.id]?.type || 'adjustment'}
                            onChange={(e) => handleMovementChange(zone.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="adjustment">Ajuste de inventario</option>
                            <option value="increase">Ingreso de material</option>
                            <option value="decrease">Consumo/Salida</option>
                            <option value="transfer">Transferencia</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo
                          </label>
                          <input
                            type="text"
                            value={movements[zone.id]?.reason || ''}
                            onChange={(e) => handleMovementChange(zone.id, 'reason', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ej. Recepción de proveedor, Producción, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notas adicionales
                          </label>
                          <textarea
                            value={movements[zone.id]?.notes || ''}
                            onChange={(e) => handleMovementChange(zone.id, 'notes', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Observaciones adicionales..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alertas */}
                  {currentStock <= (material.minStock || 0) && currentStock > 0 && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        Stock por debajo del mínimo recomendado ({material.minStock} {material.unit})
                      </span>
                    </div>
                  )}

                  {currentStock === 0 && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        Sin stock disponible en esta planta
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
            {isSubmitting ? 'Actualizando...' : 'Actualizar Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialStockModal;
