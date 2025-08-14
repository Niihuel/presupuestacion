/**
 * Gestión de Políticas Globales
 * 
 * Configuración de reglas globales del sistema:
 * - Feature flags
 * - Porcentajes por defecto
 * - Políticas de redondeo
 * - Habilitación de módulos
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, Shield, ToggleLeft, ToggleRight,
  Percent, Calculator, Package, Truck, AlertCircle, CheckCircle,
  Info, HelpCircle
} from 'lucide-react';
import { roundPercent, trackLegacyUsage } from '@compartido/utils/rounding';

const Politicas = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [policies, setPolicies] = useState({
    // Feature Flags
    USE_SERVER_PRICE: true,
    ENABLE_PACKING: true,
    ENABLE_MOUNTING: true,
    ENABLE_TRANSPORT: true,
    REQUIRE_APPROVAL: false,
    AUTO_PUBLISH_PRICES: false,
    
    // Valores por defecto
    DEFAULT_GG_PERCENT: 15,
    DEFAULT_PROFIT_PERCENT: 10,
    DEFAULT_ENGINEERING_PERCENT: 5,
    DEFAULT_TAX_PERCENT: 21,
    
    // Políticas de redondeo
    MONEY_DECIMALS: 2,
    WEIGHT_DECIMALS: 3,
    TRIPS_ROUNDING: 'CEILING',
    
    // Límites operativos
    MAX_DISCOUNT_PERCENT: 20,
    MAX_PIECES_PER_QUOTE: 100,
    MAX_TRANSPORT_DISTANCE: 500,
    
    // Validaciones
    REQUIRE_BOM_FOR_PUBLISH: true,
    REQUIRE_TECHNICAL_DATA: true,
    ALLOW_ZERO_PRICE: false
  });

  // Cargar políticas
  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.data || data);
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      setMessage({ type: 'error', text: 'Error al cargar políticas' });
    } finally {
      setLoading(false);
    }
  };

  // Guardar políticas
  const savePolicies = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policies)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Políticas guardadas exitosamente' });
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving policies:', error);
      setMessage({ type: 'error', text: 'Error al guardar políticas' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle feature flag
  const toggleFlag = (flag) => {
    setPolicies(prev => ({
      ...prev,
      [flag]: !prev[flag]
    }));
  };

  // Actualizar valor numérico
  const updateNumeric = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setPolicies(prev => ({
      ...prev,
      [field]: field.includes('PERCENT') ? roundPercent(numValue) : numValue
    }));
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600" />
            Políticas Globales
          </h1>
          <p className="text-gray-600 mt-1">
            Configuración de reglas y comportamiento del sistema
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={loadPolicies}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recargar
          </button>
          
          <button
            onClick={savePolicies}
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Cambios
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
          {/* Feature Flags */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ToggleLeft className="h-5 w-5 text-gray-600" />
              Feature Flags
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">
                    Usar Precio del Servidor (TVF v2)
                  </label>
                  <p className="text-sm text-gray-600">
                    Calcula precios usando TVF v2 en lugar de frontend
                  </p>
                </div>
                <button
                  onClick={() => toggleFlag('USE_SERVER_PRICE')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    policies.USE_SERVER_PRICE ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    policies.USE_SERVER_PRICE ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">
                    Habilitar Packing
                  </label>
                  <p className="text-sm text-gray-600">
                    Permite cálculo de viajes con reglas de empaque
                  </p>
                </div>
                <button
                  onClick={() => toggleFlag('ENABLE_PACKING')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    policies.ENABLE_PACKING ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    policies.ENABLE_PACKING ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">
                    Publicación Automática
                  </label>
                  <p className="text-sm text-gray-600">
                    Publica precios automáticamente al calcular
                  </p>
                </div>
                <button
                  onClick={() => toggleFlag('AUTO_PUBLISH_PRICES')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    policies.AUTO_PUBLISH_PRICES ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    policies.AUTO_PUBLISH_PRICES ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">
                    Requerir Aprobación
                  </label>
                  <p className="text-sm text-gray-600">
                    Los presupuestos requieren aprobación antes de enviar
                  </p>
                </div>
                <button
                  onClick={() => toggleFlag('REQUIRE_APPROVAL')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    policies.REQUIRE_APPROVAL ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    policies.REQUIRE_APPROVAL ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Valores por Defecto */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 text-gray-600" />
              Valores por Defecto
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gastos Generales (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={policies.DEFAULT_GG_PERCENT}
                  onChange={(e) => updateNumeric('DEFAULT_GG_PERCENT', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilidad (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={policies.DEFAULT_PROFIT_PERCENT}
                  onChange={(e) => updateNumeric('DEFAULT_PROFIT_PERCENT', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingeniería (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={policies.DEFAULT_ENGINEERING_PERCENT}
                  onChange={(e) => updateNumeric('DEFAULT_ENGINEERING_PERCENT', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IVA (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={policies.DEFAULT_TAX_PERCENT}
                  onChange={(e) => updateNumeric('DEFAULT_TAX_PERCENT', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Políticas de Redondeo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-gray-600" />
              Políticas de Redondeo
            </h2>
            
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Reglas Obligatorias</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Dinero: 2 decimales</li>
                      <li>• Peso: 3 decimales (toneladas)</li>
                      <li>• Viajes: CEILING siempre</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decimales para Dinero
                </label>
                <input
                  type="number"
                  value={policies.MONEY_DECIMALS}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decimales para Peso (tn)
                </label>
                <input
                  type="number"
                  value={policies.WEIGHT_DECIMALS}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Redondeo de Viajes
                </label>
                <input
                  type="text"
                  value={policies.TRIPS_ROUNDING}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Límites Operativos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-600" />
              Límites Operativos
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Máximo (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={policies.MAX_DISCOUNT_PERCENT}
                  onChange={(e) => updateNumeric('MAX_DISCOUNT_PERCENT', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máx. Piezas por Presupuesto
                </label>
                <input
                  type="number"
                  step="1"
                  value={policies.MAX_PIECES_PER_QUOTE}
                  onChange={(e) => updateNumeric('MAX_PIECES_PER_QUOTE', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distancia Máxima Transporte (km)
                </label>
                <input
                  type="number"
                  step="10"
                  value={policies.MAX_TRANSPORT_DISTANCE}
                  onChange={(e) => updateNumeric('MAX_TRANSPORT_DISTANCE', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Validaciones */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              Validaciones
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <label className="font-medium text-gray-900 text-sm">
                  Requerir BOM para Publicar
                </label>
                <button
                  onClick={() => toggleFlag('REQUIRE_BOM_FOR_PUBLISH')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    policies.REQUIRE_BOM_FOR_PUBLISH ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    policies.REQUIRE_BOM_FOR_PUBLISH ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <label className="font-medium text-gray-900 text-sm">
                  Requerir Datos Técnicos
                </label>
                <button
                  onClick={() => toggleFlag('REQUIRE_TECHNICAL_DATA')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    policies.REQUIRE_TECHNICAL_DATA ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    policies.REQUIRE_TECHNICAL_DATA ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <label className="font-medium text-gray-900 text-sm">
                  Permitir Precio Cero
                </label>
                <button
                  onClick={() => toggleFlag('ALLOW_ZERO_PRICE')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    policies.ALLOW_ZERO_PRICE ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    policies.ALLOW_ZERO_PRICE ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Politicas;