/**
 * Índice de exportaciones del módulo Projects
 * 
 * Centraliza todas las exportaciones de componentes, hooks y utilidades
 * del feature de projects para facilitar las importaciones
 */

// Componentes principales
export { default as ProjectsList } from './components/ProjectsList.jsx';
export { default as ProjectCard } from './components/ProjectCard.jsx';
export { default as ProjectModal } from './components/ProjectModal.jsx';
export { default as ProjectViewModal } from './components/ProjectViewModal.jsx';
export { default as ProjectDeleteModal } from './components/ProjectDeleteModal.jsx';
export { default as ProjectKanban } from './components/ProjectKanban.jsx';
export { default as ProjectTimeline } from './components/ProjectTimeline.jsx';
export { default as ProjectDocuments } from './components/ProjectDocuments.jsx';

// Hooks
export * from '@compartido/hooks/useProjectsHook.js';
