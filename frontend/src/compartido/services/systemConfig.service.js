/**
 * Servicio de Configuración del Sistema
 * 
 * Maneja todas las operaciones relacionadas con la configuración
 * del sistema de presupuestación
 */

import api from './api.js';

class SystemConfigService {
  /**
   * Obtener configuración completa del sistema
   */
  async getSystemConfig() {
    try {
      const response = await api.get('/api/v1/sistema/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching system config:', error);
      throw error;
    }
  }

  /**
   * Obtener una sección específica de configuración
   */
  async getSystemConfigSection(section) {
    try {
      const response = await api.get(`/api/v1/sistema/config/${section}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching system config section ${section}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar configuración completa del sistema
   */
  async updateSystemConfig(configData) {
    try {
      const response = await api.put('/api/v1/sistema/config', configData);
      return response.data;
    } catch (error) {
      console.error('Error updating system config:', error);
      throw error;
    }
  }

  /**
   * Actualizar una sección específica de configuración
   */
  async updateSystemConfigSection(section, data) {
    try {
      const response = await api.put(`/api/v1/sistema/config/${section}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating system config section ${section}:`, error);
      throw error;
    }
  }

  /**
   * Resetear configuración a valores por defecto
   */
  async resetSystemConfig(section = null) {
    try {
      const url = section 
        ? `/api/v1/sistema/config/${section}/reset`
        : '/api/v1/sistema/config/reset';
      
      const response = await api.post(url);
      return response.data;
    } catch (error) {
      console.error('Error resetting system config:', error);
      throw error;
    }
  }

  /**
   * Exportar configuración actual
   */
  async exportSystemConfig() {
    try {
      const response = await api.get('/api/v1/sistema/config/export');
      return response.data;
    } catch (error) {
      console.error('Error exporting system config:', error);
      throw error;
    }
  }

  /**
   * Importar configuración desde archivo
   */
  async importSystemConfig(configFile) {
    try {
      const formData = new FormData();
      formData.append('config', configFile);
      
      const response = await api.post('/api/v1/sistema/config/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error importing system config:', error);
      throw error;
    }
  }

  /**
   * Validar configuración actual
   */
  async validateSystemConfig() {
    try {
      const response = await api.post('/api/v1/sistema/config/validate');
      return response.data;
    } catch (error) {
      console.error('Error validating system config:', error);
      throw error;
    }
  }

  /**
   * Obtener configuraciones por defecto
   */
  async getDefaultConfigs() {
    try {
      const response = await api.get('/api/v1/sistema/config/defaults');
      return response.data;
    } catch (error) {
      console.error('Error fetching default configs:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de cambios de configuración
   */
  async getConfigHistory(limit = 20) {
    try {
      const response = await api.get('/api/v1/sistema/config/history', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching config history:', error);
      throw error;
    }
  }

  /**
   * Aplicar configuración desde una versión específica del historial
   */
  async applyConfigFromHistory(historyId) {
    try {
      const response = await api.post(`/api/v1/sistema/config/history/${historyId}/apply`);
      return response.data;
    } catch (error) {
      console.error('Error applying config from history:', error);
      throw error;
    }
  }
}

export default new SystemConfigService();
