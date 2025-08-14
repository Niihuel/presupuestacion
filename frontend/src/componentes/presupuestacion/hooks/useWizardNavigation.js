/**
 * Hook personalizado para manejar la navegación del wizard
 * 
 * Detecta intentos de salida y muestra modal de confirmación
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useWizardNavigation = ({ 
  hasUnsavedChanges, 
  onSaveAndExit, 
  onExitWithoutSaving,
  showConfirmModal,
  setShowConfirmModal 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const nextLocation = useRef(null);

  // Interceptar navegación del browser
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requiere esto
        return '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Interceptar navegación de React Router
  useEffect(() => {
    const handlePopState = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        setShowConfirmModal(true);
        // Restaurar el estado actual
        window.history.pushState(null, '', location.pathname);
        return false;
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('popstate', handlePopState);
      // Agregar una entrada al historial para interceptar el "back button"
      window.history.pushState(null, '', location.pathname);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, location.pathname, setShowConfirmModal]);

  // Función para manejar navegación programática
  const handleNavigation = useCallback((path) => {
    if (hasUnsavedChanges) {
      nextLocation.current = path;
      setShowConfirmModal(true);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate, setShowConfirmModal]);

  // Función para confirmar y salir
  const confirmAndExit = useCallback(async () => {
    try {
      if (onSaveAndExit) {
        await onSaveAndExit();
      }
      setShowConfirmModal(false);
      if (nextLocation.current) {
        navigate(nextLocation.current);
        nextLocation.current = null;
      } else {
        navigate('/presupuestos');
      }
    } catch (error) {
      console.error('Error al guardar y salir:', error);
      // Aquí podrías mostrar una notificación de error
    }
  }, [onSaveAndExit, navigate, setShowConfirmModal]);

  // Función para salir sin guardar
  const exitWithoutSaving = useCallback(() => {
    if (onExitWithoutSaving) {
      onExitWithoutSaving();
    }
    setShowConfirmModal(false);
    if (nextLocation.current) {
      navigate(nextLocation.current);
      nextLocation.current = null;
    } else {
      navigate('/presupuestos');
    }
  }, [onExitWithoutSaving, navigate, setShowConfirmModal]);

  // Función para cancelar la salida
  const cancelExit = useCallback(() => {
    setShowConfirmModal(false);
    nextLocation.current = null;
  }, [setShowConfirmModal]);

  return {
    handleNavigation,
    confirmAndExit,
    exitWithoutSaving,
    cancelExit
  };
};
