/**
 * Índice de exportaciones del módulo Customers
 * 
 * Centraliza todas las exportaciones de componentes, hooks y utilidades
 * del feature de customers para facilitar las importaciones

// Componente principal
export { default as Clientes } from './Clientes.jsx';

// Componentes auxiliares
export { default as CustomerModal } from './components/CustomerModal.jsx';
export { default as CustomerViewModal } from './components/CustomerViewModal.jsx';

// Hooks
export * from '@shared/hooks/useCustomersHook.js';
