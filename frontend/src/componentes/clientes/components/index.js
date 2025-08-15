/**
 * Índice de componentes de Customers
 * 
 * Centraliza las exportaciones de todos los componentes relacionados
 * con la gestión de clientes.

// Componentes principales
export { default as CustomerModal } from './CustomerModal.jsx';
export { default as CustomerViewModal } from './CustomerViewModal.jsx';

// Re-exportar todo para importaciones con *
export * from './CustomerModal.jsx';
export * from './CustomerViewModal.jsx';
