/**
 * Sistema de z-index unificado para evitar superposiciones
 * 
 * Jerarquía de capas:
 * 1. Base (0): Contenido normal
 * 2. Dropdown (10): Menús desplegables y tooltips
 * 3. Fixed (40): Headers, overlays de dropdown
 * 4. Modal (50): Modales principales
 * 5. Modal High (60): Modales sobre otros modales
 * 6. Tooltip (70): Tooltips críticos
 * 7. Toast (80): Notificaciones
 * 8. Maximum (90): Elementos que deben estar siempre encima
 */

export const Z_INDEX = {
  // Capa base
  BASE: 'z-0',
  
  // Dropdowns y menús contextuales
  DROPDOWN: 'z-10',
  DROPDOWN_OVERLAY: 'z-[15]',
  
  // Headers y navegación
  HEADER: 'z-40',
  HEADER_OVERLAY: 'z-[35]',
  
  // Modales principales
  MODAL: 'z-50',
  MODAL_BACKDROP: 'z-[45]',
  
  // Modales sobre modales
  MODAL_HIGH: 'z-60',
  MODAL_HIGH_BACKDROP: 'z-[55]',
  
  // Tooltips críticos
  TOOLTIP: 'z-70',
  
  // Notificaciones
  TOAST: 'z-80',
  
  // Máxima prioridad
  MAXIMUM: 'z-90'
};

export default Z_INDEX;
