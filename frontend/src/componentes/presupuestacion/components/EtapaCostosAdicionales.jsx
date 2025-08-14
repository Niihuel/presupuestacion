/**
 * Componente para la tercera etapa del wizard: Costos Adicionales
 * 
 * Permite definir costos adicionales como transporte, montaje, ingeniería, etc.
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, Truck, Wrench, AlertCircle, Info, Plus } from 'lucide-react';
import quotationService from '../../../compartido/services/quotation.service';

const EtapaCostosAdicionales = ({ data, onChange, errors = {} }) => {
  const [localData, setLocalData] = useState({
    transport_cost: 0,
    mounting_cost: 0,
    complementary_cost: 0,
    complementary_desc: '',
    other_costs: [],
    cost_notes: '',
    apply_transport: true,
    apply_mounting: true,
    apply_complementary: false,
    ...data
  });

  // Actualizar formData cuando localData cambie
  useEffect(() => {
    onChange(localData);
  }, [localData, onChange]);

  const handleInputChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCostChange = (field, value, isApplied) => {
    const numericValue = parseFloat(value) || 0;
    setLocalData(prev => ({
      ...prev,
      [field]: isApplied ? numericValue : 0,
      [`apply_${field.replace('_cost', '')}`]: isApplied
    }));
  };

  const handleToggleCost = (field, enabled) => {
    setLocalData(prev => ({
      ...prev,
      [`apply_${field.replace('_cost', '')}`]: enabled,
      [field]: enabled ? prev[field] : 0
    }));
  };

  const addOtherCost = () => {
    const newCost = {
      id: Date.now(),
      description: '',
      amount: 0
    };

    setLocalData(prev => ({
      ...prev,
      other_costs: [...prev.other_costs, newCost]
    }));
  };

  const removeOtherCost = (id) => {
    setLocalData(prev => ({
      ...prev,
      other_costs: prev.other_costs.filter(cost => cost.id !== id)
    }));
  };

  const updateOtherCost = (id, field, value) => {
    setLocalData(prev => ({
      ...prev,
      other_costs: prev.other_costs.map(cost => 
        cost.id === id ? { ...cost, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : cost
      )
    }));
  };

  // Calcular total de costos adicionales
  const calculateTotal = () => {
    const standardCosts = 
      (localData.apply_transport ? localData.transport_cost : 0) +
      (localData.apply_mounting ? localData.mounting_cost : 0) +
      (localData.apply_engineering ? localData.engineering_cost : 0) +
      (localData.apply_metallic_inserts ? localData.metallic_inserts_cost : 0) +
      (localData.apply_waterproofing ? localData.waterproofing_cost : 0);

    const otherCostsTotal = localData.other_costs.reduce((acc, cost) => acc + cost.amount, 0);

    return standardCosts + otherCostsTotal;
  };

  const totalAdditionalCosts = calculateTotal();

  // Helper: calcular transporte y montaje según Excel con backend
  const recalculateTransportAndMounting = async () => {
    try {
      if (!data?.quotation_id && !data?.id) return; // requiere id de presupuesto si existe
      const distanceKm = data?.distance_km || data?.distance_from_zone || data?.distance_from_cba || 0;
      const calc = await quotationService.calculateQuotation(data.quotation_id || data.id, { distanceKm });
      if (calc) {
        setLocalData(prev => ({
          ...prev,
          transport_cost: Math.round(calc.transport?.total || 0),
          mounting_cost: Math.round(calc.mounting?.total || 0)
        }));
      }
    } catch (_) {
      // silencioso
    }
  };

  useEffect(() => {
    if (localData.apply_transport || localData.apply_mounting) {
      recalculateTransportAndMounting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localData.apply_transport, localData.apply_mounting, data?.distance_from_zone, data?.distance_from_cba, data?.quotation_id, data?.id]);

  const costItems = [
    {
      key: 'transport',
      label: 'Transporte',
      icon: Truck,
      description: 'Costo calculado automáticamente según distancia y peso total',
      field: 'transport_cost',
      applyField: 'apply_transport',
      color: 'text-blue-600'
    },
    {
      key: 'mounting',
      label: 'Montaje',
      icon: Wrench,
      description: 'Costo calculado automáticamente (estándar por tn + traslado grúa + GG 10%)',
      field: 'mounting_cost',
      applyField: 'apply_mounting',
      color: 'text-green-600'
    },
    {
      key: 'complementary',
      label: 'Trabajos Complementarios (opcional)',
      icon: Plus,
      description: 'Trabajos no contemplados en las partidas principales (ej. movimientos menores, retiros, acondicionamientos, imprevistos).',
      field: 'complementary_cost',
      applyField: 'apply_complementary',
      color: 'text-amber-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Costos Adicionales
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Defina los costos adicionales que se aplicarán al presupuesto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Costos Estándar */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Costos Estándar</h4>

          <div className="space-y-4">
                {costItems.map((item) => {
              const Icon = item.icon;
              const isApplied = localData[item.applyField];
              
              return (
                <div
                  key={item.key}
                  className={`border rounded-lg p-4 transition-all ${
                    isApplied ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <div>
                        <h5 className="font-medium text-gray-900">{item.label}</h5>
                            <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isApplied}
                        onChange={(e) => handleToggleCost(item.field, e.target.checked)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Aplicar</span>
                    </label>
                  </div>

                      {isApplied && item.key === 'complementary' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={localData[item.field]}
                        onChange={(e) => handleInputChange(item.field, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                          <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">Descripción</label>
                          <textarea
                            value={localData.complementary_desc}
                            onChange={(e) => handleInputChange('complementary_desc', e.target.value)}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describa brevemente qué se considera complementario"
                          />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Otros Costos y Resumen */}
        <div className="space-y-4">
          {/* Otros Costos */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-900">Otros Costos</h4>
              <button
                type="button"
                onClick={addOtherCost}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Costo
              </button>
            </div>

            <div className="space-y-3">
              {localData.other_costs.map((cost) => (
                <div key={cost.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-3 mb-2">
                    <input
                      type="text"
                      value={cost.description}
                      onChange={(e) => updateOtherCost(cost.id, 'description', e.target.value)}
                      placeholder="Descripción del costo..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeOtherCost(cost.id)}
                      className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Truck className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost.amount}
                    onChange={(e) => updateOtherCost(cost.id, 'amount', e.target.value)}
                    placeholder="Monto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}

              {localData.other_costs.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">No hay otros costos definidos</p>
                  <p className="text-xs text-gray-400">Use el botón "Agregar Costo" para añadir costos personalizados</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Costos */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Resumen de Costos Adicionales</h5>
            
            <div className="space-y-2 text-sm">
              {/* Costos estándar aplicados */}
              {costItems.map((item) => {
                const isApplied = localData[item.applyField];
                const amount = localData[item.field];
                
                if (isApplied && amount > 0) {
                  return (
                    <div key={item.key} className="flex justify-between">
                      <span>{item.label}:</span>
                      <span className="font-medium">${amount.toLocaleString()}</span>
                    </div>
                  );
                }
                return null;
              })}

              {/* Otros costos */}
              {localData.other_costs.map((cost) => (
                cost.amount > 0 && (
                  <div key={cost.id} className="flex justify-between">
                    <span>{cost.description || 'Costo adicional'}:</span>
                    <span className="font-medium">${cost.amount.toLocaleString()}</span>
                  </div>
                )
              ))}

              {totalAdditionalCosts > 0 && (
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Costos Adicionales:</span>
                    <span className="text-blue-600">${totalAdditionalCosts.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {totalAdditionalCosts === 0 && (
                <div className="text-center py-2 text-gray-500">
                  No hay costos adicionales aplicados
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h6 className="font-medium text-blue-900">Información</h6>
                <p className="text-sm text-blue-700 mt-1">
                  Los costos adicionales se sumarán al subtotal de las piezas para calcular 
                  el total del presupuesto antes de impuestos.
                </p>
              </div>
            </div>
          </div>

          {/* Notas sobre costos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas sobre costos adicionales
            </label>
            <textarea
              value={localData.cost_notes}
              onChange={(e) => handleInputChange('cost_notes', e.target.value)}
              placeholder="Comentarios o justificaciones sobre los costos adicionales..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtapaCostosAdicionales;
