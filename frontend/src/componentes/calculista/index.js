/**
 * Índice de exportaciones del módulo Calculistas
 * 
 * Centraliza todas las exportaciones de componentes y utilidades
 * del feature de calculistas para facilitar las importaciones
 */

// Componentes principales (reutilizables expuestos desde páginas)
export { default as CalculistaModal } from '@paginas/Calculistas/CalculistaModal.jsx';
export { default as CalculistaViewModal } from '@paginas/Calculistas/CalculistaViewModal.jsx';
export { default as CalculistaDeleteModal } from '@paginas/Calculistas/CalculistaDeleteModal.jsx';

// Hooks
export * from '@shared/hooks/useCalculistasHook.js';
