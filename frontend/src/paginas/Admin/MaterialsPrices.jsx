import { useState, useEffect } from 'react';
import { 
  Package, 
  Save, 
  Lock, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  FileText,
  Filter,
  Calendar,
  MapPin,
  AlertCircle,
  Check,
  Search
} from 'lucide-react';
import { useZones } from '@compartido/hooks/useZonesHook';
import { useMaterials } from '@compartido/hooks/useMaterialsHook';
import materialService from '@compartido/services/material.service';

const MaterialsPrices = () => {
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [prices, setPrices] = useState([]);
  const [editedPrices, setEditedPrices] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosingMonth, setIsClosingMonth] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);

  const { data: zonesData } = useZones();
  const { data: materialsData } = useMaterials();
  
  const zones = zonesData?.zones || [];
  const materials = materialsData?.materials || [];

  // Categorías únicas de materiales
  const categories = [...new Set(materials.map(m => m.category))].filter(Boolean);

  // Cargar precios cuando cambia zona o mes
  useEffect(() => {
    if (selectedZone && selectedMonth) {
      loadPrices();
    }
  }, [selectedZone, selectedMonth]);

  const loadPrices = async () => {
    setIsLoading(true);
    try {
      // Obtener precios vigentes
      const response = await materialService.getVigenteMaterialPrices(
        selectedZone, 
        `${selectedMonth}-01`
      );
      
      const pricesData = response?.data || [];
      
      // Combinar con información de materiales y calcular comparación
      const prevMonth = new Date(selectedMonth);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthStr = prevMonth.toISOString().slice(0, 7);
      
      const prevResponse = await materialService.getVigenteMaterialPrices(
        selectedZone,
        `${prevMonthStr}-01`
      );
      const prevPrices = prevResponse?.data || [];
      const prevPricesMap = {};
      prevPrices.forEach(p => {
        prevPricesMap[p.material_id] = p.price;
      });

      // Crear lista completa de materiales con precios
      const fullPricesList = materials.map(material => {
        const currentPrice = pricesData.find(p => p.material_id === material.id);
        const prevPrice = prevPricesMap[material.id];
        
        return {
          material_id: material.id,
          material_name: material.name,
          category: material.category,
          unit: material.unit,
          current_price: currentPrice?.price || 0,
          prev_price: prevPrice || 0,
          delta: prevPrice ? ((currentPrice?.price || 0) - prevPrice) / prevPrice * 100 : null,
          is_active: currentPrice?.is_active ?? true,
          valid_from: currentPrice?.valid_from || `${selectedMonth}-01`
        };
      });

      setPrices(fullPricesList);
      setEditedPrices({});
    } catch (error) {
      console.error('Error loading prices:', error);
      setMessage({ type: 'error', text: 'Error al cargar precios' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (materialId, value) => {
    const numValue = parseFloat(value) || 0;
    setEditedPrices(prev => ({
      ...prev,
      [materialId]: numValue
    }));
  };

  const handleSave = async () => {
    const changedPrices = Object.entries(editedPrices);
    if (changedPrices.length === 0) {
      setMessage({ type: 'warning', text: 'No hay cambios para guardar' });
      return;
    }

    setIsSaving(true);
    try {
      for (const [materialId, price] of changedPrices) {
        await materialService.setMaterialPrice({
          material_id: parseInt(materialId),
          zone_id: parseInt(selectedZone),
          price: parseFloat(price),
          valid_from: `${selectedMonth}-01`
        });
      }

      setMessage({ 
        type: 'success', 
        text: `${changedPrices.length} precio(s) actualizado(s) exitosamente` 
      });
      
      setEditedPrices({});
      loadPrices(); // Recargar para actualizar deltas
    } catch (error) {
      console.error('Error saving prices:', error);
      setMessage({ type: 'error', text: 'Error al guardar precios' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!window.confirm('¿Está seguro de cerrar el mes? Esta acción consolidará los precios y no se podrán modificar.')) {
      return;
    }

    setIsClosingMonth(true);
    try {
      await materialService.closeMaterialPricesMonth(selectedZone, `${selectedMonth}-01`);
      setMessage({ type: 'success', text: 'Mes cerrado exitosamente' });
      loadPrices();
    } catch (error) {
      console.error('Error closing month:', error);
      setMessage({ type: 'error', text: 'Error al cerrar el mes' });
    } finally {
      setIsClosingMonth(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Material', 'Categoría', 'Unidad', 'Precio Actual', 'Precio Anterior', 'Variación %'];
    const rows = filteredPrices.map(p => [
      p.material_name,
      p.category,
      p.unit,
      getCurrentPrice(p.material_id).toFixed(2),
      p.prev_price.toFixed(2),
      p.delta ? p.delta.toFixed(2) : '0.00'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `precios_materiales_${selectedZone}_${selectedMonth}.csv`;
    link.click();
  };

  const exportPDF = () => {
    // Simplificado - usar librería como jsPDF para implementación completa
    window.print();
  };

  const getCurrentPrice = (materialId) => {
    return editedPrices[materialId] !== undefined 
      ? editedPrices[materialId] 
      : prices.find(p => p.material_id === materialId)?.current_price || 0;
  };

  const getDeltaColor = (delta) => {
    if (!delta) return 'text-gray-500';
    return delta > 0 ? 'text-red-500' : 'text-green-500';
  };

  const getDeltaIcon = (delta) => {
    if (!delta) return null;
    return delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  // Filtrar precios
  const filteredPrices = prices.filter(p => {
    const matchesSearch = !searchTerm || 
      p.material_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesChanged = !showOnlyChanged || editedPrices[p.material_id] !== undefined;
    
    return matchesSearch && matchesCategory && matchesChanged;
  });

  // Calcular estadísticas
  const stats = {
    totalMaterials: filteredPrices.length,
    changedCount: Object.keys(editedPrices).length,
    avgDelta: filteredPrices.reduce((acc, p) => acc + (p.delta || 0), 0) / filteredPrices.length || 0,
    increasedCount: filteredPrices.filter(p => p.delta > 0).length,
    decreasedCount: filteredPrices.filter(p => p.delta < 0).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">Precios de Materiales</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Zona
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar zona</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Mes
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyChanged}
              onChange={(e) => setShowOnlyChanged(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Solo modificados</span>
          </label>

          <div className="text-sm text-gray-600 flex items-center justify-end">
            {stats.changedCount > 0 && (
              <span className="font-medium text-blue-600">
                {stats.changedCount} cambio(s) pendiente(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' :
          message.type === 'error' ? 'bg-red-50 text-red-800' :
          message.type === 'warning' ? 'bg-amber-50 text-amber-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> :
           message.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
           <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      {selectedZone && selectedMonth && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Materiales</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMaterials}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Incrementos</p>
            <p className="text-2xl font-bold text-red-600 flex items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {stats.increasedCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Reducciones</p>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <TrendingDown className="h-5 w-5" />
              {stats.decreasedCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Variación Promedio</p>
            <p className={`text-2xl font-bold ${getDeltaColor(stats.avgDelta)}`}>
              {stats.avgDelta.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Sin Cambios</p>
            <p className="text-2xl font-bold text-gray-500">
              {stats.totalMaterials - stats.increasedCount - stats.decreasedCount}
            </p>
          </div>
        </div>
      )}

      {/* Price Table */}
      {selectedZone && selectedMonth && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando precios...</p>
            </div>
          ) : filteredPrices.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unidad
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Anterior
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Actual
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPrices.map(price => (
                      <tr 
                        key={price.material_id}
                        className={editedPrices[price.material_id] !== undefined ? 'bg-yellow-50' : ''}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {price.material_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {price.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {price.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          ${price.prev_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={getCurrentPrice(price.material_id)}
                            onChange={(e) => handlePriceChange(price.material_id, e.target.value)}
                            className="w-24 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {price.delta !== null && (
                            <span className={`flex items-center justify-center gap-1 ${getDeltaColor(price.delta)}`}>
                              {getDeltaIcon(price.delta)}
                              {price.delta.toFixed(2)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Mostrando {filteredPrices.length} de {prices.length} materiales
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseMonth}
                    disabled={isClosingMonth || Object.keys(editedPrices).length > 0}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    {isClosingMonth ? 'Cerrando...' : 'Cerrar Mes'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || Object.keys(editedPrices).length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Guardando...' : `Guardar (${Object.keys(editedPrices).length})`}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No se encontraron materiales</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialsPrices;

