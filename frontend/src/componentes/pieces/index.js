/**
 * Índice de exportaciones del módulo Pieces
 * 
 * Centraliza todas las exportaciones de componentes, hooks y utilidades
 * del feature de pieces para facilitar las importaciones
 */

// Componentes principales 
export { default as PieceModal } from './components/PieceModal.jsx';
export { default as PieceCard } from './components/PieceCard.jsx';
export { default as PiecesList } from './components/PiecesList.jsx';
export { default as PieceViewModal } from './components/PieceViewModal.jsx';

// Hooks
export * from '@shared/hooks/usePiecesHook.js';
export * from '@shared/hooks/usePieceSearch.js';
