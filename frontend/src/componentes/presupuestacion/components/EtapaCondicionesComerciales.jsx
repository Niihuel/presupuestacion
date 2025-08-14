/**
 * Componente para la cuarta etapa del wizard: Condiciones Comerciales
 * 
 * Permite definir términos de pago, validez, descuentos e impuestos
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Percent, FileText, AlertCircle, Calculator, Clock } from 'lucide-react';

const EtapaCondicionesComerciales = ({ data, onChange, errors = {} }) => {
  const [localData, setLocalData] = useState({
    payment_terms: 'contado',
    custom_payment_terms: '',
    validity_days: 30,
    discount_percentage: 0,
    discount_description: '',
    tax_rate: 0.21, // 21% IVA por defecto
    tax_included: false,
    delivery_time: '',
    warranty_terms: '',
    additional_conditions: '',
    currency: 'ARS',
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

  const paymentTermsOptions = [
    { value: 'contado', label: 'Contado' },
    { value: '30_dias', label: '30 días' },
    { value: '60_dias', label: '60 días' },
    { value: '90_dias', label: '90 días' },
    { value: '50_50', label: '50% adelanto - 50% contra entrega' },
    { value: '30_70', label: '30% adelanto - 70% contra entrega' },
    { value: 'custom', label: 'Condiciones personalizadas' }
  ];

  const currencies = [
    { value: 'ARS', label: 'Pesos Argentinos (ARS)', symbol: '$' },
    { value: 'USD', label: 'Dólares Americanos (USD)', symbol: 'US$' },
    { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
  ];

  const getPaymentTermsDisplay = () => {
    if (localData.payment_terms === 'custom') {
      return localData.custom_payment_terms || 'Condiciones personalizadas';
    }
    return paymentTermsOptions.find(opt => opt.value === localData.payment_terms)?.label || '';
  };

  const calculateFinalAmount = () => {
    // Obtener subtotal de etapas anteriores (esto vendría del contexto del wizard)
    const piecesSubtotal = data.pieces?.reduce((acc, piece) => 
      acc + (piece.quantity * piece.unit_price), 0) || 0;
    
    const additionalCosts = 
      (data.transport_cost || 0) +
      (data.mounting_cost || 0) +
      (data.engineering_cost || 0) +
      (data.metallic_inserts_cost || 0) +
      (data.waterproofing_cost || 0) +
      (data.other_costs?.reduce((acc, cost) => acc + cost.amount, 0) || 0);

    const subtotal = piecesSubtotal + additionalCosts;

    // Aplicar descuento
    const discountAmount = subtotal * (localData.discount_percentage / 100);
    const afterDiscount = subtotal - discountAmount;

    // Calcular impuestos
    const taxAmount = afterDiscount * localData.tax_rate;
    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      total
    };
  };

  const amounts = calculateFinalAmount();
  const selectedCurrency = currencies.find(c => c.value === localData.currency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Condiciones Comerciales
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Defina las condiciones de pago, validez y términos comerciales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condiciones de Pago y Validez */}
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Condiciones de Pago</h4>
            
            {/* Moneda */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={localData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Términos de Pago */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Términos de Pago *
              </label>
              <select
                value={localData.payment_terms}
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.payment_terms ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {paymentTermsOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.payment_terms && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.payment_terms}
                </p>
              )}
            </div>

            {/* Condiciones Personalizadas */}
            {localData.payment_terms === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condiciones de Pago Personalizadas
                </label>
                <textarea
                  value={localData.custom_payment_terms}
                  onChange={(e) => handleInputChange('custom_payment_terms', e.target.value)}
                  placeholder="Describa las condiciones de pago personalizadas..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Validez del Presupuesto */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validez del Presupuesto (días) *
              </label>
              <input
                type="number"
                min="1"
                value={localData.validity_days}
                onChange={(e) => handleInputChange('validity_days', parseInt(e.target.value) || 30)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.validity_days ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.validity_days && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.validity_days}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                El presupuesto será válido hasta: {
                  new Date(Date.now() + (localData.validity_days * 24 * 60 * 60 * 1000))
                    .toLocaleDateString()
                }
              </p>
            </div>

            {/* Tiempo de Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo de Entrega
              </label>
              <input
                type="text"
                value={localData.delivery_time}
                onChange={(e) => handleInputChange('delivery_time', e.target.value)}
                placeholder="Ej: 15-20 días hábiles"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Descuentos e Impuestos */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Descuentos e Impuestos</h4>

            {/* Descuento */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descuento (%)
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={localData.discount_percentage}
                  onChange={(e) => handleInputChange('discount_percentage', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex items-center px-3 py-2 bg-gray-50 border rounded-lg">
                  <Percent className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              {localData.discount_percentage > 0 && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={localData.discount_description}
                    onChange={(e) => handleInputChange('discount_description', e.target.value)}
                    placeholder="Descripción del descuento (opcional)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Impuestos */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tasa de Impuestos (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={localData.tax_rate * 100}
                onChange={(e) => handleInputChange('tax_rate', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                IVA estándar en Argentina: 21%
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localData.tax_included}
                  onChange={(e) => handleInputChange('tax_included', e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Los precios incluyen impuestos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Resumen Financiero y Condiciones Adicionales */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Resumen Financiero
            </h5>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {selectedCurrency?.symbol}{amounts.subtotal.toLocaleString()}
                </span>
              </div>

              {localData.discount_percentage > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({localData.discount_percentage}%):</span>
                  <span className="font-medium">
                    -{selectedCurrency?.symbol}{amounts.discountAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Subtotal después de descuento:</span>
                <span className="font-medium">
                  {selectedCurrency?.symbol}{amounts.afterDiscount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Impuestos ({(localData.tax_rate * 100).toFixed(1)}%):</span>
                <span className="font-medium">
                  {selectedCurrency?.symbol}{amounts.taxAmount.toLocaleString()}
                </span>
              </div>

              <div className="border-t border-blue-300 pt-2 mt-2">
                <div className="flex justify-between font-bold text-blue-900">
                  <span>Total:</span>
                  <span className="text-lg">
                    {selectedCurrency?.symbol}{amounts.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {localData.tax_included && (
              <p className="text-xs text-blue-700 mt-2">
                * Los precios mostrados incluyen impuestos
              </p>
            )}
          </div>

          {/* Condiciones de Garantía */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Términos de Garantía
            </label>
            <textarea
              value={localData.warranty_terms}
              onChange={(e) => handleInputChange('warranty_terms', e.target.value)}
              placeholder="Especifique los términos de garantía..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Condiciones Adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condiciones Adicionales
            </label>
            <textarea
              value={localData.additional_conditions}
              onChange={(e) => handleInputChange('additional_conditions', e.target.value)}
              placeholder="Otras condiciones comerciales o términos especiales..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Resumen de Condiciones */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Resumen de Condiciones</h5>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Pago:</span>
                <span>{getPaymentTermsDisplay()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Validez:</span>
                <span>{localData.validity_days} días</span>
              </div>

              {localData.delivery_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Entrega:</span>
                  <span>{localData.delivery_time}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Moneda:</span>
                <span>{selectedCurrency?.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtapaCondicionesComerciales;
