/**
 * Clase utilitaria para estandarizar respuestas de API
 * 
 * Proporciona métodos para crear respuestas consistentes
 * en toda la aplicación
 * 
 * @author Sistema de Presupuestación
 * @version 2.0.0
 */

class ApiResponse {
  /**
   * Crear respuesta exitosa
   * @param {*} data - Datos a devolver
   * @param {string} message - Mensaje descriptivo
   * @param {number} statusCode - Código de estado HTTP
   */
  static success(data = null, message = 'Operación exitosa', statusCode = 200) {
    return {
      success: true,
      message,
      data,
      statusCode
    };
  }

  /**
   * Crear respuesta de error
   * @param {string} message - Mensaje de error
   * @param {number} statusCode - Código de estado HTTP
   * @param {*} errors - Errores detallados (opcional)
   */
  static error(message = 'Error en la operación', statusCode = 500, errors = null) {
    return {
      success: false,
      message,
      errors,
      statusCode
    };
  }

  /**
   * Crear respuesta de validación
   * @param {*} errors - Errores de validación
   * @param {string} message - Mensaje descriptivo
   */
  static validation(errors, message = 'Errores de validación') {
    return {
      success: false,
      message,
      errors,
      statusCode: 422
    };
  }

  /**
   * Crear respuesta de paginación
   * @param {Array} data - Datos paginados
   * @param {Object} pagination - Información de paginación
   * @param {string} message - Mensaje descriptivo
   */
  static paginated(data, pagination, message = 'Datos obtenidos exitosamente') {
    return {
      success: true,
      message,
      data,
      pagination,
      statusCode: 200
    };
  }

  /**
   * Crear respuesta no autorizada
   * @param {string} message - Mensaje de error
   */
  static unauthorized(message = 'No autorizado') {
    return {
      success: false,
      message,
      statusCode: 401
    };
  }

  /**
   * Crear respuesta prohibida
   * @param {string} message - Mensaje de error
   */
  static forbidden(message = 'Acceso prohibido') {
    return {
      success: false,
      message,
      statusCode: 403
    };
  }

  /**
   * Crear respuesta no encontrado
   * @param {string} message - Mensaje de error
   */
  static notFound(message = 'Recurso no encontrado') {
    return {
      success: false,
      message,
      statusCode: 404
    };
  }
}

module.exports = ApiResponse;
