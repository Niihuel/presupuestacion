/**
 * Shared Components Index
 * 
 * Exportaciones centralizadas de componentes compartidos
 */

// Componentes base
export { default as Encabezado } from './Encabezado.jsx';
export { default as Sidebar } from './Sidebar.jsx';
export { default as EncabezadoNavegacion } from './EncabezadoNavegacion.jsx';
export { default as CampoContrasena } from './CampoContrasena.jsx';
export { default as PrivateRoute } from './PrivateRoute.jsx';
export { default as ErrorBoundary } from './ErrorBoundary.jsx';

// Modales
export { default as DeleteConfirmModal } from './DeleteConfirmModal';

// Navegación y UI
export { default as Paginacion } from './Paginacion';

// Estados
export { default as EstadoVacio } from './EstadoVacio';
export { default as LoadingState, Spinner, CardSkeleton, ListSkeleton, LoadingOverlay, CardGridSkeleton } from './LoadingState';

// Feature-specific component re-exports
