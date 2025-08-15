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
export { default as PrivateRoute } from './RutaPrivada.jsx';
export { default as ErrorBoundary } from './LimiteErrores.jsx';

// Modales
export { default as DeleteConfirmModal } from './ModalConfirmarEliminar.jsx';

// Navegación y UI
export { default as Paginacion } from './Paginacion.jsx';

// Estados
export { default as LoadingState, Spinner, CardSkeleton, ListSkeleton, LoadingOverlay, CardGridSkeleton } from './EstadoCargando.jsx';

// Feature-specific component re-exports
