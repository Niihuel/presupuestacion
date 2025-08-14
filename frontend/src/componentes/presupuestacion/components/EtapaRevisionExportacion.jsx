/**
 * Componente para la quinta etapa del wizard: Revisión y Exportación
 * 
 * Permite revisar todo el presupuesto y exportar en diferentes formatos
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Mail, Eye, CheckCircle, AlertTriangle, 
  Building, User, Package, DollarSign, Calendar, Printer, 
  FileX, Send, Copy
} from 'lucide-react';

const EtapaRevisionExportacion = ({ data: formData, onChange, errors = {} }) => {
  const [localData, setLocalData] = useState({
    review_approved: false,
    internal_notes: '',
    quotation_number: '',
    export_format: 'pdf',
    include_technical_details: true,
    include_terms_conditions: true,
    send_to_customer: false,
    customer_email: '',
    email_subject: '',
    email_message: '',
    ...formData
  });

  const [exportStatus, setExportStatus] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);

  // Actualizar formData cuando localData cambie
  useEffect(() => {
    onChange(localData);
  }, [localData, onChange]);

  // Validar datos del presupuesto
  useEffect(() => {
    const issues = [];

    if (!formData.project_name) {
      issues.push({ type: 'error', message: 'Falta el nombre del proyecto' });
    }

    if (!formData.customer_id) {
      issues.push({ type: 'error', message: 'No se ha seleccionado un cliente' });
    }

    if (!formData.pieces || formData.pieces.length === 0) {
      issues.push({ type: 'error', message: 'No se han seleccionado piezas' });
    }

    if (!formData.payment_terms) {
      issues.push({ type: 'error', message: 'No se han definido términos de pago' });
    }

    if (!formData.validity_days || formData.validity_days < 1) {
      issues.push({ type: 'error', message: 'Los días de validez deben ser mayor a 0' });
    }

    // Advertencias
    if (formData.pieces && formData.pieces.some(p => !p.unit_price || p.unit_price === 0)) {
      issues.push({ type: 'warning', message: 'Algunas piezas tienen precio 0' });
    }

    if (!formData.estimated_delivery) {
      issues.push({ type: 'warning', message: 'No se ha definido fecha estimada de entrega' });
    }

    setValidationIssues(issues);
  }, [formData]);

  const handleInputChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calcular totales finales
  const calculateFinalTotals = () => {
    const piecesSubtotal = formData.pieces?.reduce((acc, piece) => 
      acc + (piece.quantity * piece.unit_price), 0) || 0;
    
    const additionalCosts = 
      (formData.transport_cost || 0) +
      (formData.mounting_cost || 0) +
      (formData.engineering_cost || 0) +
      (formData.metallic_inserts_cost || 0) +
      (formData.waterproofing_cost || 0) +
      (formData.other_costs?.reduce((acc, cost) => acc + cost.amount, 0) || 0);

    const subtotal = piecesSubtotal + additionalCosts;
    const discountAmount = subtotal * ((formData.discount_percentage || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (formData.tax_rate || 0.21);
    const total = afterDiscount + taxAmount;

    return {
      piecesSubtotal,
      additionalCosts,
      subtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      total
    };
  };

  const totals = calculateFinalTotals();
  const hasErrors = validationIssues.some(issue => issue.type === 'error');
  const hasWarnings = validationIssues.some(issue => issue.type === 'warning');

  const exportFormats = [
    { value: 'pdf', label: 'PDF', description: 'Formato estándar para impresión' },
    { value: 'excel', label: 'Excel', description: 'Para edición y análisis' },
    { value: 'word', label: 'Word', description: 'Para personalización adicional' }
  ];

  const handleExport = async (format) => {
    setExportStatus('exporting');
    try {
      // Aquí iría la lógica de exportación
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular exportación
      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const generateQuotationNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const quotationNum = `PRES-${year}${month}${day}-${random}`;
    setLocalData(prev => ({
      ...prev,
      quotation_number: quotationNum
    }));
  };

  useEffect(() => {
    if (!localData.quotation_number) {
      generateQuotationNumber();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Revisión y Exportación
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Revise los datos del presupuesto y prepare la documentación
        </p>
      </div>

      {/* Estado de Validación */}
      {validationIssues.length > 0 && (
        <div className={`border rounded-lg p-4 ${
          hasErrors ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {hasErrors ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            <h4 className={`font-medium ${hasErrors ? 'text-red-900' : 'text-yellow-900'}`}>
              {hasErrors ? 'Errores que requieren atención' : 'Advertencias'}
            </h4>
          </div>
          <ul className="space-y-1">
            {validationIssues.map((issue, index) => (
              <li key={index} className={`text-sm ${
                issue.type === 'error' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                • {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen del Presupuesto */}
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900">Resumen del Presupuesto</h4>

          {/* Información del Proyecto */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Información del Proyecto
            </h5>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Proyecto:</span> {formData.project_name || 'Sin definir'}</div>
              <div><span className="font-medium">Tipo:</span> {formData.project_type || 'Sin definir'}</div>
              <div><span className="font-medium">Prioridad:</span> {formData.priority || 'Sin definir'}</div>
              {formData.estimated_delivery && (
                <div><span className="font-medium">Entrega estimada:</span> {formData.estimated_delivery}</div>
              )}
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Cliente
            </h5>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Cliente ID:</span> {formData.customer_id || 'Sin seleccionar'}</div>
              {formData.customer_contact && (
                <div><span className="font-medium">Contacto:</span> {formData.customer_contact}</div>
              )}
            </div>
          </div>

          {/* Resumen de Piezas */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Piezas ({formData.pieces?.length || 0} tipos)
            </h5>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {formData.pieces?.map((piece, index) => (
                <div key={index} className="flex justify-between">
                  <span>{piece.piece_name} (x{piece.quantity})</span>
                  <span className="font-medium">${(piece.quantity * piece.unit_price).toLocaleString()}</span>
                </div>
              )) || <div className="text-gray-500">No hay piezas seleccionadas</div>}
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Resumen Financiero
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal piezas:</span>
                <span>${totals.piecesSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Costos adicionales:</span>
                <span>${totals.additionalCosts.toLocaleString()}</span>
              </div>
              {formData.discount_percentage > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({formData.discount_percentage}%):</span>
                  <span>-${totals.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Impuestos ({((formData.tax_rate || 0.21) * 100).toFixed(1)}%):</span>
                <span>${totals.taxAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-blue-300 pt-2 font-bold text-blue-900">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="text-lg">${totals.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Condiciones Comerciales */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Condiciones Comerciales
            </h5>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Pago:</span> {formData.payment_terms || 'Sin definir'}</div>
              <div><span className="font-medium">Validez:</span> {formData.validity_days || 0} días</div>
              <div><span className="font-medium">Moneda:</span> {formData.currency || 'ARS'}</div>
              {formData.delivery_time && (
                <div><span className="font-medium">Entrega:</span> {formData.delivery_time}</div>
              )}
            </div>
          </div>
        </div>

        {/* Opciones de Exportación */}
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900">Opciones de Exportación</h4>

          {/* Número de Presupuesto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Presupuesto
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localData.quotation_number}
                onChange={(e) => handleInputChange('quotation_number', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={generateQuotationNumber}
                className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Formato de Exportación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de Exportación
            </label>
            <div className="space-y-2">
              {exportFormats.map(format => (
                <label key={format.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="export_format"
                    value={format.value}
                    checked={localData.export_format === format.value}
                    onChange={(e) => handleInputChange('export_format', e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{format.label}</div>
                    <div className="text-sm text-gray-600">{format.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Opciones de Contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido del Documento
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localData.include_technical_details}
                  onChange={(e) => handleInputChange('include_technical_details', e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Incluir detalles técnicos</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localData.include_terms_conditions}
                  onChange={(e) => handleInputChange('include_terms_conditions', e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Incluir términos y condiciones</span>
              </label>
            </div>
          </div>

          {/* Notas Internas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Internas
            </label>
            <textarea
              value={localData.internal_notes}
              onChange={(e) => handleInputChange('internal_notes', e.target.value)}
              placeholder="Notas internas que no aparecerán en el documento exportado..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones de Exportación */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleExport(localData.export_format)}
              disabled={hasErrors || exportStatus === 'exporting'}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                hasErrors 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : exportStatus === 'exporting'
                  ? 'bg-blue-300 text-blue-800 cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {exportStatus === 'exporting' ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exportar {exportFormats.find(f => f.value === localData.export_format)?.label}
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                Vista Previa
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>

          {/* Estado de Exportación */}
          {exportStatus && (
            <div className={`p-3 rounded-lg ${
              exportStatus === 'success' ? 'bg-green-50 border border-green-200' :
              exportStatus === 'error' ? 'bg-red-50 border border-red-200' : ''
            }`}>
              {exportStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Documento exportado correctamente</span>
                </div>
              )}
              {exportStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-700">
                  <FileX className="w-4 h-4" />
                  <span className="text-sm">Error al exportar el documento</span>
                </div>
              )}
            </div>
          )}

          {/* Envío por Email */}
          <div className="border-t pt-4">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={localData.send_to_customer}
                onChange={(e) => handleInputChange('send_to_customer', e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Enviar por email al cliente
              </span>
            </label>

            {localData.send_to_customer && (
              <div className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={localData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="Email del cliente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={localData.email_subject}
                    onChange={(e) => handleInputChange('email_subject', e.target.value)}
                    placeholder="Asunto del email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <textarea
                    value={localData.email_message}
                    onChange={(e) => handleInputChange('email_message', e.target.value)}
                    placeholder="Mensaje del email..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  Enviar Email
                </button>
              </div>
            )}
          </div>

          {/* Aprobación Final */}
          <div className="border-t pt-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={localData.review_approved}
                onChange={(e) => handleInputChange('review_approved', e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <span className="ml-2 text-sm text-gray-700">
                He revisado todos los datos y confirmo que el presupuesto está listo para ser enviado al cliente
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtapaRevisionExportacion;
