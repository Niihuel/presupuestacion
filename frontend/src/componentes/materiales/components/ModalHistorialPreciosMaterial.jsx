/**
 * Modal para mostrar historial de precios de un material
 * 
 * Muestra:
 * - Historial de cambios de precios por planta
 * - Gráficos de evolución de precios
 * - Comparación entre plantas
 * - Exportación de datos
 */

import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Factory,
  Download,
  BarChart3
} from 'lucide-react';
import { useMaterialPriceHistory } from '@compartido/hooks/useMaterialsHook';

const MaterialPriceHistoryModal = ({ material, onClose }) => {
  const [selectedPlant, setSelectedPlant] = useState('all');
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 3m, 6m, 1y, all

  const { data: priceHistory, isLoading } = useMaterialPriceHistory(material.id);

  // Filtrar datos según planta y rango de tiempo
  const getFilteredHistory = () => {
    if (!priceHistory) return [];

    let filtered = priceHistory;

    // Filtrar por planta
    if (selectedPlant !== 'all') {
      filtered = filtered.filter(entry => entry.plantId === selectedPlant);
    }

    // Filtrar por rango de tiempo
    if (timeRange !== 'all') {
      const now = new Date();
      const months = {
        '1m': 1,
        '3m': 3,
        '6m': 6,
        '1y': 12
      };
      
      const cutoffDate = new Date();
      cutoffDate.setMonth(now.getMonth() - months[timeRange]);
      
      filtered = filtered.filter(entry => new Date(entry.date) >= cutoffDate);
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredHistory = getFilteredHistory();

  // Calcular estadísticas
  const getStats = () => {
    if (filteredHistory.length < 2) return null;

    const prices = filteredHistory.map(entry => entry.price);
    const currentPrice = prices[0];
    const previousPrice = prices[1];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    const changeFromPrevious = ((currentPrice - previousPrice) / previousPrice) * 100;
    const changeFromMin = ((currentPrice - minPrice) / minPrice) * 100;
    const changeFromMax = ((currentPrice - maxPrice) / maxPrice) * 100;

    return {
      current: currentPrice,
      previous: previousPrice,
      min: minPrice,
      max: maxPrice,
      average: avgPrice,
      changeFromPrevious,
      changeFromMin,
      changeFromMax
    };
  };

  const stats = getStats();

  // Obtener plantas únicas
  const getUniquePlants = () => {
    if (!priceHistory) return [];
    const plants = [...new Set(priceHistory.map(entry => entry.plantName))];
    return plants.map(plantName => ({
      id: priceHistory.find(entry => entry.plantName === plantName)?.plantId,
      name: plantName
    }));
  };

  const uniquePlants = getUniquePlants();

  const handleExport = () => {
    // TODO: Implementar exportación
    console.log('Exportar historial de precios');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center text-gray-600 mt-4">Cargando historial de precios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historial de Precios</h2>
              <p className="text-sm text-gray-600">{material.name} - {material.code}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planta</label>
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las plantas</option>
                {uniquePlants.map(plant => (
                  <option key={plant.id} value={plant.id}>{plant.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1m">Último mes</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="1y">Último año</option>
                <option value="all">Todo el historial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay historial</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron cambios de precios para los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* Estadísticas */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Precio Actual</p>
                        <p className="text-2xl font-bold text-blue-900">
                          ${stats.current.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Precio Promedio</p>
                        <p className="text-2xl font-bold text-green-900">
                          ${stats.average.toLocaleString()}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Precio Mínimo</p>
                        <p className="text-2xl font-bold text-orange-900">
                          ${stats.min.toLocaleString()}
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600">Precio Máximo</p>
                        <p className="text-2xl font-bold text-red-900">
                          ${stats.max.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* Variaciones */}
              {stats && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Variaciones de Precio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vs. precio anterior:</span>
                      <div className={`flex items-center gap-1 font-medium ${
                        stats.changeFromPrevious >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.changeFromPrevious >= 0 ? 
                          <TrendingUp className="h-4 w-4" /> : 
                          <TrendingDown className="h-4 w-4" />
                        }
                        {Math.abs(stats.changeFromPrevious).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vs. precio mínimo:</span>
                      <div className={`flex items-center gap-1 font-medium ${
                        stats.changeFromMin >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {stats.changeFromMin >= 0 ? 
                          <TrendingUp className="h-4 w-4" /> : 
                          <TrendingDown className="h-4 w-4" />
                        }
                        {Math.abs(stats.changeFromMin).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vs. precio máximo:</span>
                      <div className={`flex items-center gap-1 font-medium ${
                        stats.changeFromMax >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {stats.changeFromMax >= 0 ? 
                          <TrendingUp className="h-4 w-4" /> : 
                          <TrendingDown className="h-4 w-4" />
                        }
                        {Math.abs(stats.changeFromMax).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de cambios */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Historial de Cambios</h3>
                <div className="space-y-3">
                  {filteredHistory.map((entry, index) => {
                    const previousEntry = filteredHistory[index + 1];
                    const priceChange = previousEntry ? 
                      ((entry.price - previousEntry.price) / previousEntry.price) * 100 : 0;

                    return (
                      <div key={`${entry.plantId}-${entry.date}`} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Factory className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{entry.plantName}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                {new Date(entry.date).toLocaleDateString('es-AR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              ${entry.price.toLocaleString()}
                            </div>
                            {previousEntry && (
                              <div className={`text-sm flex items-center gap-1 ${
                                priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {priceChange >= 0 ? 
                                  <TrendingUp className="h-3 w-3" /> : 
                                  <TrendingDown className="h-3 w-3" />
                                }
                                {Math.abs(priceChange).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {entry.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{entry.notes}</p>
                          </div>
                        )}
                        
                        {entry.updatedBy && (
                          <div className="mt-2 text-xs text-gray-500">
                            Actualizado por: {entry.updatedBy}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialPriceHistoryModal;
