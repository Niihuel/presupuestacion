/**
 * Componente de Rutas Protegidas
 * 
 * Componente de orden superior que protege rutas de la aplicación,
 * verificando el estado de autenticación del usuario.
 * 
 * Funcionalidades:
 * - Verifica si el usuario está autenticado
 * - Muestra pantalla de carga durante la verificación
 * - Redirige al login si no hay autenticación
 * - Permite acceso a rutas hijas si está autenticado
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@nucleo/store/auth.store';
import { LoadingPage } from './CargandoSpinner';

const PrivateRoute = () => {
  // Obtener estado de autenticación desde el store de Zustand
  const { isAuthenticated, isLoading } = useAuthStore();

  // Mostrar pantalla de carga mientras se verifica la autenticación
  // Esto previene el parpadeo durante la hidratación del estado
  if (isLoading) {
    return <LoadingPage text="Verificando autenticación..." />;
  }

  // Si no está autenticado, redirigir al login
  // replace=true evita que se pueda volver atrás con el botón del navegador
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar las rutas hijas
  return <Outlet />;
};

export default PrivateRoute;