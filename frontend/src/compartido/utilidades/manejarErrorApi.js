/**
 * Maneja errores de las llamadas a la API de manera consistente
 */
export const handleApiError = (error) => {
  if (!error.response) {
    return {
      message: 'Error de conexión. Por favor, verifica tu conexión a internet.',
      status: 'error',
      code: 'NETWORK_ERROR'
    };
  }

  const { status, data } = error.response;

  // Errores de autenticación
  if (status === 401) {
    // Mensajes específicos para diferentes casos de autenticación
    const message = data.message || 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    
    // Detectar errores específicos
    if (message.includes('pendiente de aprobación')) {
      return {
        message: 'Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos por email cuando sea activada.',
        status: 'warning',
        code: 'PENDING_APPROVAL'
      };
    }
    
    if (message.includes('Nombre de usuario o contraseña incorrectos')) {
      return {
        message: 'Nombre de usuario o contraseña incorrectos',
        status: 'error',
        code: 'INVALID_CREDENTIALS'
      };
    }
    
    if (message.includes('no ha sido verificada')) {
      return {
        message: 'Tu cuenta no ha sido verificada. Por favor, verifica tu email.',
        status: 'warning',
        code: 'UNVERIFIED_ACCOUNT'
      };
    }
    
    return {
      message,
      status: 'error',
      code: 'UNAUTHORIZED'
    };
  }

  // Errores de validación
  if (status === 400) {
    const message = data.message || 'Los datos proporcionados no son válidos.';
    
    // Detectar errores específicos de registro
    if (message.includes('Ya existe una cuenta con este email')) {
      return {
        message: 'Ya existe una cuenta registrada con este email',
        status: 'error',
        code: 'EMAIL_EXISTS'
      };
    }
    
    if (message.includes('nombre de usuario ya está en uso')) {
      return {
        message: 'El nombre de usuario ya está en uso',
        status: 'error',
        code: 'USERNAME_EXISTS'
      };
    }
    
    return {
      message,
      status: 'error',
      code: 'VALIDATION_ERROR',
      errors: data.errors
    };
  }

  // Errores de permisos
  if (status === 403) {
    return {
      message: data.message || 'No tienes permiso para realizar esta acción.',
      status: 'error',
      code: 'FORBIDDEN'
    };
  }

  // Error del servidor
  if (status === 500) {
    return {
      message: 'Error interno del servidor. Por favor, intenta más tarde.',
      status: 'error',
      code: 'SERVER_ERROR'
    };
  }

  // Otros errores
  return {
    message: data.message || 'Ha ocurrido un error inesperado.',
    status: 'error',
    code: 'UNKNOWN_ERROR',
    originalError: data
  };
};