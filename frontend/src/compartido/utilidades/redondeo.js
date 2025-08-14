/**
 * Helpers centralizados de redondeo
 * 
 * Reglas obligatorias:
 * - Dinero: 2 decimales
 * - Peso: 3 decimales (toneladas)
 * - Viajes: CEILING siempre
 */

/**
 * Redondear valores monetarios a 2 decimales
 * @param {number} value - Valor a redondear
 * @returns {number} Valor redondeado a 2 decimales
 */
export const roundMoney = (value) => {
  if (value == null || isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
};

/**
 * Redondear peso a 3 decimales (toneladas)
 * @param {number} value - Peso en toneladas
 * @returns {number} Peso redondeado a 3 decimales
 */
export const roundWeight = (value) => {
  if (value == null || isNaN(value)) return 0;
  return Math.round(value * 1000) / 1000;
};

/**
 * Redondear peso en kg a entero
 * @param {number} value - Peso en kilogramos
 * @returns {number} Peso redondeado sin decimales
 */
export const roundKg = (value) => {
  if (value == null || isNaN(value)) return 0;
  return Math.round(value);
};

/**
 * Calcular viajes (siempre ceiling)
 * @param {number} value - Número de viajes calculado
 * @returns {number} Viajes redondeados hacia arriba
 */
export const ceilTrips = (value) => {
  if (value == null || isNaN(value) || value <= 0) return 0;
  return Math.ceil(value);
};

/**
 * Redondear porcentaje a 1 decimal
 * @param {number} value - Porcentaje
 * @returns {number} Porcentaje redondeado a 1 decimal
 */
export const roundPercent = (value) => {
  if (value == null || isNaN(value)) return 0;
  return Math.round(value * 10) / 10;
};

/**
 * Formatear dinero con símbolo de moneda
 * @param {number} value - Valor monetario
 * @param {string} currency - Moneda (default: 'ARS')
 * @returns {string} Valor formateado con moneda
 */
export const formatMoney = (value, currency = 'ARS') => {
  const rounded = roundMoney(value);
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol} ${rounded.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Formatear peso con unidad
 * @param {number} value - Peso
 * @param {string} unit - Unidad ('tn' o 'kg')
 * @returns {string} Peso formateado con unidad
 */
export const formatWeight = (value, unit = 'tn') => {
  if (unit === 'tn') {
    const rounded = roundWeight(value);
    return `${rounded.toLocaleString('es-AR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    })} tn`;
  } else {
    const rounded = roundKg(value);
    return `${rounded.toLocaleString('es-AR')} kg`;
  }
};

/**
 * Calcular delta porcentual entre dos valores
 * @param {number} current - Valor actual
 * @param {number} previous - Valor anterior
 * @returns {number} Delta porcentual redondeado a 1 decimal
 */
export const calculateDeltaPercent = (current, previous) => {
  if (!previous || previous === 0) return 0;
  const delta = ((current - previous) / previous) * 100;
  return roundPercent(delta);
};

/**
 * Determinar tendencia basada en delta
 * @param {number} current - Valor actual
 * @param {number} previous - Valor anterior
 * @returns {'up'|'down'|'equal'} Tendencia
 */
export const getTrend = (current, previous) => {
  if (!previous || current === previous) return 'equal';
  return current > previous ? 'up' : 'down';
};

/**
 * Validar y limpiar valor numérico
 * @param {any} value - Valor a validar
 * @param {number} defaultValue - Valor por defecto si es inválido
 * @returns {number} Valor numérico válido
 */
export const sanitizeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
};

/**
 * Logger para tracking de uso legacy
 * Solo funciona en desarrollo
 */
export const trackLegacyUsage = (component, message) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[DEPRECATED] ${component}: ${message}`);
    
    // Track en window para métricas
    if (typeof window !== 'undefined') {
      window.__LEGACY_CALLS__ = window.__LEGACY_CALLS__ || [];
      window.__LEGACY_CALLS__.push({
        component,
        message,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
    }
  }
};

// Exportar todo como objeto también
export default {
  roundMoney,
  roundWeight,
  roundKg,
  ceilTrips,
  roundPercent,
  formatMoney,
  formatWeight,
  calculateDeltaPercent,
  getTrend,
  sanitizeNumber,
  trackLegacyUsage
};