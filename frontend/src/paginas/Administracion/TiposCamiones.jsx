/**
 * Gestión de Tipos de Camiones y Reglas de Empaque
 * 
 * Configuración de:
 * - Tipos de camiones con capacidades
 * - Reglas de empaque por familia de piezas
 * - Preview de unidades por camión
 */

import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Save, RefreshCw, Edit, Trash2, Package,
  AlertCircle, CheckCircle, Info, Layers, Calculator,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { roundWeight, ceilTrips } from '@compartido/utils/rounding';

const TruckTypes = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Estados de datos
  const [truckTypes, setTruckTypes] = useState([]);
  const [packingRules, setPackingRules] = useState([]);
  const [families, setFamilies] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [expandedRules, setExpandedRules] = useState(new Set());
  
  // Estados de modales
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  
  // Form data
  const [truckForm, setTruckForm] = useState({
    name: '',
    code: '',
    capacity_tons: 0,
    useful_volume_m3: 0,
    max_length_m: 0,
    max_width_m: 0,
    max_height_m: 0,
    cost_per_trip: 0,
    is_active: true
  });
  
  const [ruleForm, setRuleForm] = useState({
    family_id: '',
    truck_type_id: '',
    pieces_per_truck: 0,
    max_layers: 1,
    orientation: 'ANY',
    stacking_allowed: true,
    notes: ''
  });

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [trucksRes, rulesRes, familiesRes] = await Promise.all([
        fetch('/api/truck-types'),
        fetch('/api/packing-rules'),
        fetch('/api/piece-families')
      ]);
      
      if (trucksRes.ok) {
        const data = await trucksRes.json();
        setTruckTypes(data.data || data);
      }
      
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setPackingRules(data.data || data);
      }
      
      if (familiesRes.ok) {
        const data = await familiesRes.json();
        setFamilies(data.data || data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  // Guardar camión
  const saveTruck = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const url = editingTruck 
        ? `/api/truck-types/${editingTruck.id}`
        : '/api/truck-types';
      
      const response = await fetch(url, {
        method: editingTruck ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(truckForm)
      });
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingTruck ? 'Camión actualizado' : 'Camión creado' 
        });
        setShowTruckModal(false);
        loadData();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving truck:', error);
      setMessage({ type: 'error', text: 'Error al guardar camión' });
    } finally {
      setSaving(false);
    }
  };

  // Guardar regla
  const saveRule = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const url = editingRule 
        ? `/api/packing-rules/${editingRule.id}`
        : '/api/packing-rules';
      
      const response = await fetch(url, {
        method: editingRule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm)
      });
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingRule ? 'Regla actualizada' : 'Regla creada' 
        });
        setShowRuleModal(false);
        loadData();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      setMessage({ type: 'error', text: 'Error al guardar regla' });
    } finally {
      setSaving(false);
    }
  };

  // Eliminar camión
  const deleteTruck = async (id) => {
    if (!confirm('¿Está seguro de eliminar este camión?')) return;
    
    try {
      const response = await fetch(`/api/truck-types/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Camión eliminado' });
        loadData();
      }
    } catch (error) {
      console.error('Error deleting truck:', error);
      setMessage({ type: 'error', text: 'Error al eliminar camión' });
    }
  };

  // Calcular unidades por camión (preview)
  const calculateUnitsPerTruck = (truck, rule) => {
    if (!truck || !rule) return 0;
    
    // Por simplicidad, usar el valor directo de la regla
    // En producción, esto vendría del util unitsPerTruck
    return rule.pieces_per_truck;
  };

  // Calcular viajes necesarios
  const calculateTrips = (units, unitsPerTruck) => {
    if (!unitsPerTruck || unitsPerTruck === 0) return 0;
    return ceilTrips(units / unitsPerTruck);
  };

  // Abrir modal de camión
  const openTruckModal = (truck = null) => {
    if (truck) {
      setEditingTruck(truck);
      setTruckForm({
        name: truck.name,
        code: truck.code,
        capacity_tons: truck.capacity_tons,
        useful_volume_m3: truck.useful_volume_m3,
        max_length_m: truck.max_length_m,
        max_width_m: truck.max_width_m,
        max_height_m: truck.max_height_m,
        cost_per_trip: truck.cost_per_trip,
        is_active: truck.is_active
      });
    } else {
      setEditingTruck(null);
      setTruckForm({
        name: '',
        code: '',
        capacity_tons: 0,
        useful_volume_m3: 0,
        max_length_m: 0,
        max_width_m: 0,
        max_height_m: 0,
        cost_per_trip: 0,
        is_active: true
      });
    }
    setShowTruckModal(true);
  };

  // Abrir modal de regla
  const openRuleModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        family_id: rule.family_id,
        truck_type_id: rule.truck_type_id,
        pieces_per_truck: rule.pieces_per_truck,
        max_layers: rule.max_layers,
        orientation: rule.orientation,
        stacking_allowed: rule.stacking_allowed,
        notes: rule.notes
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        family_id: '',
        truck_type_id: '',
        pieces_per_truck: 0,
        max_layers: 1,
        orientation: 'ANY',
        stacking_allowed: true,
        notes: ''
      });
    }
    setShowRuleModal(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-7 w-7 text-blue-600" />
            Tipos de Camiones y Reglas de Empaque
          </h1>
          <p className="text-gray-600 mt-1">
            Configuración de capacidades y reglas de carga
          </p>
        </div>
        
        <div className="flex gap-3">
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

      {/* Mensaje */}
      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tipos de Camiones */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="h-5 w-5 text-gray-600" />
                Tipos de Camiones
              </h2>
              <button
                onClick={() => openTruckModal()}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Camión
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {truckTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay camiones configurados
                </div>
              ) : (
                truckTypes.map(truck => (
                  <div 
                    key={truck.id}
                    className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                      selectedTruck?.id === truck.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTruck(truck)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {truck.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Código: {truck.code}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div>Capacidad: {roundWeight(truck.capacity_tons)} tn</div>
                          <div>Volumen: {truck.useful_volume_m3} m³</div>
                          <div>Largo máx: {truck.max_length_m} m</div>
                          <div>Costo/viaje: ${truck.cost_per_trip}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTruckModal(truck);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTruck(truck.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {!truck.is_active && (
                      <div className="mt-2 text-xs text-red-600">
                        Inactivo
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reglas de Empaque */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                Reglas de Empaque
              </h2>
              <button
                onClick={() => openRuleModal()}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nueva Regla
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {packingRules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay reglas configuradas
                </div>
              ) : (
                packingRules.map(rule => {
                  const family = families.find(f => f.id === rule.family_id);
                  const truck = truckTypes.find(t => t.id === rule.truck_type_id);
                  const isExpanded = expandedRules.has(rule.id);
                  
                  return (
                    <div key={rule.id} className="border rounded-lg">
                      <div 
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          const newExpanded = new Set(expandedRules);
                          if (isExpanded) {
                            newExpanded.delete(rule.id);
                          } else {
                            newExpanded.add(rule.id);
                          }
                          setExpandedRules(newExpanded);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {family?.name || 'Familia'} - {truck?.name || 'Camión'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {rule.pieces_per_truck} piezas/camión
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRuleModal(rule);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t bg-gray-50">
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Capas máximas:</span>
                              <span className="font-medium">{rule.max_layers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Orientación:</span>
                              <span className="font-medium">{rule.orientation}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Apilable:</span>
                              <span className="font-medium">
                                {rule.stacking_allowed ? 'Sí' : 'No'}
                              </span>
                            </div>
                            {rule.notes && (
                              <div className="mt-2 text-xs text-gray-500">
                                {rule.notes}
                              </div>
                            )}
                          </div>
                          
                          {/* Preview de cálculo */}
                          <div className="mt-4 p-3 bg-white rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                              <Calculator className="h-4 w-4" />
                              Preview de Cálculo
                            </h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">100 piezas:</span>
                                <span className="font-medium">
                                  {calculateTrips(100, rule.pieces_per_truck)} viajes
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">500 piezas:</span>
                                <span className="font-medium">
                                  {calculateTrips(500, rule.pieces_per_truck)} viajes
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">1000 piezas:</span>
                                <span className="font-medium">
                                  {calculateTrips(1000, rule.pieces_per_truck)} viajes
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Camión */}
      {showTruckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTruck ? 'Editar Camión' : 'Nuevo Camión'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={truckForm.name}
                  onChange={(e) => setTruckForm({...truckForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={truckForm.code}
                  onChange={(e) => setTruckForm({...truckForm, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad (tn)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={truckForm.capacity_tons}
                    onChange={(e) => setTruckForm({...truckForm, capacity_tons: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volumen útil (m³)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={truckForm.useful_volume_m3}
                    onChange={(e) => setTruckForm({...truckForm, useful_volume_m3: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Largo máx (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={truckForm.max_length_m}
                    onChange={(e) => setTruckForm({...truckForm, max_length_m: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho máx (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={truckForm.max_width_m}
                    onChange={(e) => setTruckForm({...truckForm, max_width_m: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alto máx (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={truckForm.max_height_m}
                    onChange={(e) => setTruckForm({...truckForm, max_height_m: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo por viaje ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={truckForm.cost_per_trip}
                  onChange={(e) => setTruckForm({...truckForm, cost_per_trip: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={truckForm.is_active}
                  onChange={(e) => setTruckForm({...truckForm, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Activo
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowTruckModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveTruck}
                disabled={saving || !truckForm.name || !truckForm.code}
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

      {/* Modal de Regla */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRule ? 'Editar Regla' : 'Nueva Regla de Empaque'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Familia de Piezas *
                </label>
                <select
                  value={ruleForm.family_id}
                  onChange={(e) => setRuleForm({...ruleForm, family_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {families.map(family => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Camión *
                </label>
                <select
                  value={ruleForm.truck_type_id}
                  onChange={(e) => setRuleForm({...ruleForm, truck_type_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {truckTypes.map(truck => (
                    <option key={truck.id} value={truck.id}>
                      {truck.name} ({truck.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piezas por Camión *
                </label>
                <input
                  type="number"
                  step="1"
                  value={ruleForm.pieces_per_truck}
                  onChange={(e) => setRuleForm({...ruleForm, pieces_per_truck: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capas Máximas
                </label>
                <input
                  type="number"
                  step="1"
                  value={ruleForm.max_layers}
                  onChange={(e) => setRuleForm({...ruleForm, max_layers: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orientación
                </label>
                <select
                  value={ruleForm.orientation}
                  onChange={(e) => setRuleForm({...ruleForm, orientation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ANY">Cualquiera</option>
                  <option value="HORIZONTAL">Horizontal</option>
                  <option value="VERTICAL">Vertical</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stacking_allowed"
                  checked={ruleForm.stacking_allowed}
                  onChange={(e) => setRuleForm({...ruleForm, stacking_allowed: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="stacking_allowed" className="ml-2 block text-sm text-gray-700">
                  Permitir apilamiento
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={ruleForm.notes}
                  onChange={(e) => setRuleForm({...ruleForm, notes: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveRule}
                disabled={saving || !ruleForm.family_id || !ruleForm.truck_type_id || !ruleForm.pieces_per_truck}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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

export default TruckTypes;