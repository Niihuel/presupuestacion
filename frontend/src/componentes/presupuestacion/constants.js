/**
 * Configuración y constantes para el Wizard de Presupuestación

// Configuración del auto-guardado
export const AUTO_SAVE_INTERVAL = 30000; // 30 segundos

// Estados kanban disponibles
export const KANBAN_STATES = {
  NUEVO: 'nuevo',
  EN_DESARROLLO: 'en_desarrollo',
  EN_COTIZACION: 'en_cotizacion',
  PARA_REVISION: 'para_revision',
  ENVIADO: 'enviado',
  EN_SEGUIMIENTO: 'en_seguimiento',
  ACEPTADO: 'aceptado',
  RECHAZADO: 'rechazado'
};

// Tipos de proyecto disponibles
export const PROJECT_TYPES = [
  { value: 'estructural', label: 'Estructural' },
  { value: 'arquitectonico', label: 'Arquitectónico' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'otro', label: 'Otro' }
];

// Niveles de prioridad
export const PRIORITIES = [
  { value: 'baja', label: 'Baja', color: 'text-green-600' },
  { value: 'media', label: 'Media', color: 'text-yellow-600' },
  { value: 'alta', label: 'Alta', color: 'text-red-600' },
  { value: 'urgente', label: 'Urgente', color: 'text-red-800 font-semibold' }
];

// Términos de pago predefinidos
export const PAYMENT_TERMS = [
  { value: 'contado', label: 'Contado' },
  { value: '30_dias', label: '30 días' },
  { value: '60_dias', label: '60 días' },
  { value: '90_dias', label: '90 días' },
  { value: '50_50', label: '50% adelanto - 50% contra entrega' },
  { value: '30_70', label: '30% adelanto - 70% contra entrega' },
  { value: 'custom', label: 'Condiciones personalizadas' }
];

// Monedas disponibles
export const CURRENCIES = [
  { value: 'ARS', label: 'Pesos Argentinos (ARS)', symbol: '$' },
  { value: 'USD', label: 'Dólares Americanos (USD)', symbol: 'US$' },
  { value: 'EUR', label: 'Euros (EUR)', symbol: '€' }
];

// Formatos de exportación
export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', description: 'Formato estándar para impresión' },
  { value: 'excel', label: 'Excel', description: 'Para edición y análisis' },
  { value: 'word', label: 'Word', description: 'Para personalización adicional' }
];

// Tipos de acciones para seguimiento
export const ACTION_TYPES = [
  { value: 'call', label: 'Llamar al cliente', icon: 'Phone' },
  { value: 'email', label: 'Enviar email', icon: 'Mail' },
  { value: 'meeting', label: 'Programar reunión', icon: 'Calendar' },
  { value: 'follow_up', label: 'Hacer seguimiento', icon: 'Target' },
  { value: 'review', label: 'Revisar propuesta', icon: 'FileText' },
  { value: 'update', label: 'Actualizar presupuesto', icon: 'RefreshCw' }
];

// Configuración de validación por etapa
export const VALIDATION_RULES = {
  1: {
    required: ['project_name', 'customer_id'],
    optional: ['description', 'project_type', 'priority', 'estimated_delivery', 'notes']
  },
  2: {
    required: ['pieces'],
    optional: ['notes'],
    custom: {
      pieces: (pieces) => pieces && pieces.length > 0,
      piece_quantities: (pieces) => pieces && pieces.every(p => p.quantity > 0)
    }
  },
  3: {
    required: [],
    optional: ['transport_cost', 'mounting_cost', 'engineering_cost', 'metallic_inserts_cost', 'waterproofing_cost', 'other_costs', 'cost_notes']
  },
  4: {
    required: ['payment_terms', 'validity_days'],
    optional: ['custom_payment_terms', 'discount_percentage', 'tax_rate', 'delivery_time', 'warranty_terms', 'additional_conditions', 'currency'],
    custom: {
      validity_days: (days) => days && days > 0,
      custom_payment_terms: (terms, paymentTerms) => paymentTerms !== 'custom' || (terms && terms.trim().length > 0)
    }
  },
  5: {
    required: ['review_approved'],
    optional: ['internal_notes', 'quotation_number', 'export_format', 'include_technical_details', 'include_terms_conditions']
  },
  6: {
    required: [],
    optional: ['kanban_status', 'follow_up_date', 'customer_response', 'probability', 'estimated_closing_date']
  }
};

// Configuración de la tasa de impuestos por defecto (Argentina)
export const DEFAULT_TAX_RATE = 0.21; // 21% IVA

// Configuración de descuentos máximos
export const MAX_DISCOUNT_PERCENTAGE = 50;

// Configuración de días de validez por defecto
export const DEFAULT_VALIDITY_DAYS = 30;

// Configuración de probabilidad inicial
export const DEFAULT_PROBABILITY = 50;
