/**
 * Gestión de Tarifas de Transporte
 * 
 * Configuración de tarifario por:
 * - Distancia (tramos)
 * - Categoría de largo
 * - Zona de destino
 * - Fecha de vigencia
 */

import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Save, RefreshCw, Edit, Trash2,
  AlertCircle, CheckCircle, Calendar, MapPin,
  DollarSign, Route, ChevronDown, ChevronUp
} from 'lucide-react';
import { roundMoney } from '@compartido/utilidades/redondeo.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TransportTariffs = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Estados de datos
  const [tariffs, setTariffs] = useState([]);
  const [zones, setZones] = useState([]);
  const [expandedTariffs, setExpandedTariffs] = useState(new Set());
  
  // Estados de modales
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [editingTariff, setEditingTariff] = useState(null);
  
  // Filtros
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Form data
  const [tariffForm, setTariffForm] = useState({
    zone_id: '',
    distance_from_km: 0,
    distance_to_km: 0,
    category: 'STANDARD',
    price_per_trip: 0,
    extra_per_km: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: null,
    notes: ''
  });

  // Categorías de largo
  const CATEGORIES = [
    { value: 'STANDARD', label: 'Estándar (< 12m)', color: 'blue' },
    { value: 'LONG', label: 'Largo (12-18m)', color: 'yellow' },
    { value: 'EXTRA_LONG', label: 'Extra Largo (> 18m)', color: 'red' },
    { value: 'SPECIAL', label: 'Especial', color: 'purple' }
  ];

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [tariffsRes, zonesRes] = await Promise.all([
        fetch('/api/v1/transport-tariffs'),
        fetch('/api/zones')
      ]);
      
      if (tariffsRes.ok) {
        const data = await tariffsRes.json();
        setTariffs(data.data || data);
      }
      
      if (zonesRes.ok) {
        const data = await zonesRes.json();
        setZones(data.data || data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  // Guardar tarifa
  const saveTariff = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const url = editingTariff 
        ? `/api/v1/transport-tariffs/${editingTariff.id}`
        : '/api/v1/transport-tariffs';
      
      const response = await fetch(url, {
        method: editingTariff ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tariffForm)
      });
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingTariff ? 'Tarifa actualizada' : 'Tarifa creada' 
        });
        setShowTariffModal(false);
        loadData();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving tariff:', error);
      setMessage({ type: 'error', text: 'Error al guardar tarifa' });
    } finally {
      setSaving(false);
    }
  };

  // Eliminar tarifa
  const deleteTariff = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta tarifa?')) return;
    
    try {
      const response = await fetch(`/api/v1/transport-tariffs/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Tarifa eliminada' });
        loadData();
      }
    } catch (error) {
      console.error('Error deleting tariff:', error);
      setMessage({ type: 'error', text: 'Error al eliminar tarifa' });
    }
  };

  // Copiar tarifas del mes anterior
  const copyFromPreviousMonth = async () => {
    if (!selectedZone || !selectedDate) {
      setMessage({ type: 'warning', text: 'Seleccione zona y fecha' });
      return;
    }
    
    const prevMonth = new Date(selectedDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    
    try {
      const response = await fetch('/api/v1/transport-tariffs/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: selectedZone,
          from_date: prevMonth.toISOString().split('T')[0],
          to_date: selectedDate
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Tarifas copiadas exitosamente' });
        loadData();
      }
    } catch (error) {
      console.error('Error copying tariffs:', error);
      setMessage({ type: 'error', text: 'Error al copiar tarifas' });
    }
  };

  // Abrir modal de tarifa
  const openTariffModal = (tariff = null) => {
    if (tariff) {
      setEditingTariff(tariff);
      setTariffForm({
        zone_id: tariff.zone_id,
        distance_from_km: tariff.distance_from_km,
        distance_to_km: tariff.distance_to_km,
        category: tariff.category,
        price_per_trip: tariff.price_per_trip,
        extra_per_km: tariff.extra_per_km,
        valid_from: tariff.valid_from,
        valid_to: tariff.valid_to,
        notes: tariff.notes
      });
    } else {
      setEditingTariff(null);
      setTariffForm({
        zone_id: selectedZone || '',
        distance_from_km: 0,
        distance_to_km: 0,
        category: 'STANDARD',
        price_per_trip: 0,
        extra_per_km: 0,
        valid_from: selectedDate || new Date().toISOString().split('T')[0],
        valid_to: null,
        notes: ''
      });
    }
    setShowTariffModal(true);
  };

  // Calcular precio total
  const calculateTotalPrice = (basePrice, extraPerKm, distance) => {
    return roundMoney(basePrice + (extraPerKm * Math.max(0, distance)));
  };

  // Filtrar tarifas
  const filteredTariffs = tariffs.filter(t => {
    const matchesZone = !selectedZone || t.zone_id === parseInt(selectedZone);
    const matchesDate = !selectedDate || 
      (t.valid_from <= selectedDate && (!t.valid_to || t.valid_to >= selectedDate));
    return matchesZone && matchesDate;
  });

  // Agrupar tarifas por zona
  const tariffsByZone = filteredTariffs.reduce((acc, tariff) => {
    const zone = zones.find(z => z.id === tariff.zone_id);
    const zoneName = zone?.name || 'Sin zona';
    if (!acc[zoneName]) acc[zoneName] = [];
    acc[zoneName].push(tariff);
    return acc;
  }, {});

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Route className="h-7 w-7 text-blue-600" />
            Tarifas de Transporte
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de tarifario por distancia y categoría
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={copyFromPreviousMonth}
            disabled={!selectedZone || !selectedDate}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Copiar Mes Anterior
          </button>
          
          <button
            onClick={() => openTariffModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarifa
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Zona
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las zonas</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Fecha Vigencia
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje */}
      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 
          message.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-yellow-50 text-yellow-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tarifas */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(tariffsByZone).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay tarifas configuradas</p>
              <button
                onClick={() => openTariffModal()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Primera Tarifa
              </button>
            </div>
          ) : (
            Object.entries(tariffsByZone).map(([zoneName, zoneTariffs]) => (
              <div key={zoneName} className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    {zoneName}
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distancia (km)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio Base
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Extra/km
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vigencia
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {zoneTariffs.map(tariff => {
                        const category = CATEGORIES.find(c => c.value === tariff.category);
                        const isExpanded = expandedTariffs.has(tariff.id);
                        
                        return (
                          <React.Fragment key={tariff.id}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {tariff.distance_from_km} - {tariff.distance_to_km}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${category?.color || 'gray'}-100 text-${category?.color || 'gray'}-800`}>
                                  {category?.label || tariff.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                ${roundMoney(tariff.price_per_trip)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                ${roundMoney(tariff.extra_per_km)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                {format(new Date(tariff.valid_from), 'dd/MM/yyyy', { locale: es })}
                                {tariff.valid_to && (
                                  <span> - {format(new Date(tariff.valid_to), 'dd/MM/yyyy', { locale: es })}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedTariffs);
                                      if (isExpanded) {
                                        newExpanded.delete(tariff.id);
                                      } else {
                                        newExpanded.add(tariff.id);
                                      }
                                      setExpandedTariffs(newExpanded);
                                    }}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => openTariffModal(tariff)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteTariff(tariff.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                  <div className="space-y-3">
                                    {/* Ejemplos de cálculo */}
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Ejemplos de Cálculo:
                                      </h4>
                                      <div className="grid grid-cols-3 gap-4 text-sm">
                                        {[50, 100, 200].map(distance => (
                                          <div key={distance} className="bg-white p-3 rounded-lg">
                                            <div className="text-gray-600">{distance} km:</div>
                                            <div className="font-medium text-lg">
                                              ${calculateTotalPrice(
                                                tariff.price_per_trip,
                                                tariff.extra_per_km,
                                                distance - tariff.distance_from_km
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {tariff.notes && (
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-700">Notas:</h4>
                                        <p className="text-sm text-gray-600 mt-1">{tariff.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Tarifa */}
      {showTariffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTariff ? 'Editar Tarifa' : 'Nueva Tarifa'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona *
                  </label>
                  <select
                    value={tariffForm.zone_id}
                    onChange={(e) => setTariffForm({...tariffForm, zone_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={tariffForm.category}
                    onChange={(e) => setTariffForm({...tariffForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desde (km) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={tariffForm.distance_from_km}
                    onChange={(e) => setTariffForm({...tariffForm, distance_from_km: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hasta (km) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={tariffForm.distance_to_km}
                    onChange={(e) => setTariffForm({...tariffForm, distance_to_km: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Base ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tariffForm.price_per_trip}
                    onChange={(e) => setTariffForm({...tariffForm, price_per_trip: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extra por km ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tariffForm.extra_per_km}
                    onChange={(e) => setTariffForm({...tariffForm, extra_per_km: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vigente Desde *
                  </label>
                  <input
                    type="date"
                    value={tariffForm.valid_from}
                    onChange={(e) => setTariffForm({...tariffForm, valid_from: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vigente Hasta
                  </label>
                  <input
                    type="date"
                    value={tariffForm.valid_to || ''}
                    onChange={(e) => setTariffForm({...tariffForm, valid_to: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={tariffForm.notes}
                  onChange={(e) => setTariffForm({...tariffForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Preview de cálculo */}
              {tariffForm.price_per_trip > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Preview de Tarifas:
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {[50, 100, 200].map(distance => (
                      <div key={distance} className="text-blue-700">
                        <span className="font-medium">{distance} km:</span> 
                        <span className="ml-1">
                          ${calculateTotalPrice(
                            tariffForm.price_per_trip,
                            tariffForm.extra_per_km,
                            Math.max(0, distance - tariffForm.distance_from_km)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowTariffModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveTariff}
                disabled={saving || !tariffForm.zone_id || !tariffForm.price_per_trip || !tariffForm.valid_from}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportTariffs;