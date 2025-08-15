/**
 * Índice de Componentes Compartidos (Unificado en Español)
 * 
 * Exporta componentes con nombres en español y mantiene alias en inglés
 * de forma temporal para compatibilidad.
 */

// Base
export { default as Encabezado } from './Encabezado.jsx';
export { default as Sidebar } from './Sidebar.jsx';
export { default as EncabezadoNavegacion } from './EncabezadoNavegacion.jsx';
export { default as CampoContrasena } from './CampoContrasena.jsx';

// Rutas protegidas y límites de error
export { default as RutaPrivada } from './RutaPrivada.jsx';
export { default as LimiteErrores } from './LimiteErrores.jsx';

// Alias en inglés (compatibilidad temporal)
export { default as PrivateRoute } from './RutaPrivada.jsx';
export { default as ErrorBoundary } from './LimiteErrores.jsx';

// Modales
export { default as DialogoConfirmacion } from './DialogoConfirmacion.jsx';
export { default as ModalBase } from './ModalBase.jsx';

// Alias en inglés (compatibilidad temporal)
export { default as DeleteConfirmModal } from './DialogoConfirmacion.jsx';
export { default as BaseModal } from './ModalBase.jsx';

// Navegación y UI
export { default as Paginacion } from './Paginacion.jsx';
export { default as EstadoVacio } from './EstadoVacio.jsx';

// Estado de carga (skeletons)
export { default as EstadoCargando } from './EstadoCargando.jsx';
export { default as LoadingState } from './EstadoCargando.jsx';
export { Spinner, CardSkeleton, ListSkeleton, LoadingOverlay, CardGridSkeleton } from './EstadoCargando.jsx';

// Spinner simple y página de carga
export { default as CargandoSpinner, LoadingPage } from './CargandoSpinner.jsx';
export { default as LoadingSpinner } from './CargandoSpinner.jsx';
