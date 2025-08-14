/**
 * Servicio de Gestión de Zonas/Plantas
 * 
 * Servicio completo para gestión de zonas con:
 * - CRUD básico de zonas
 * - Gestión de precios por zona
 * - Copia entre zonas
 * - Dashboard y métricas por zona
 * - Geolocalización y mapas
 */

import api from './api.js';

class ZoneService {
  // =================== CRUD BÁSICO ===================
  
  /**
   * Obtener todas las zonas con filtros y paginación
   */
  async getZones(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/zones?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching zones:', error);
      throw error;
    }
  }

  /**
   * Obtener una zona específica con detalles completos
   */
  async getZone(id) {
    try {
      const response = await api.get(`/zones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching zone:', error);
      throw error;
    }
  }

  /**
   * Crear nueva zona
   */
  async createZone(zoneData) {
    try {
      const response = await api.post('/zones', zoneData);
      return response.data;
    } catch (error) {
      console.error('Error creating zone:', error);
      throw error;
    }
  }

  /**
   * Actualizar zona existente
   */
  async updateZone(id, zoneData) {
    try {
      const response = await api.put(`/zones/${id}`, zoneData);
      return response.data;
    } catch (error) {
      console.error('Error updating zone:', error);
      throw error;
    }
  }

  /**
   * Eliminar zona
   */
  async deleteZone(id) {
    try {
      const response = await api.delete(`/zones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting zone:', error);
      throw error;
    }
  }

  // =================== GESTIÓN DE PRECIOS ===================

  /**
   * Obtener precios de piezas por zona
   */
  async getZonePrices(zoneId, filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/zones/${zoneId}/prices?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching zone prices:', error);
      throw error;
    }
  }

  /**
   * Actualizar precio de una pieza en una zona
   */
  async updatePiecePrice(zoneId, pieceId, priceData) {
    try {
      const response = await api.put(`/zones/${zoneId}/prices/${pieceId}`, priceData);
      return response.data;
    } catch (error) {
      console.error('Error updating piece price:', error);
      throw error;
    }
  }

  /**
   * Actualizar múltiples precios en una zona
   */
  async updateMultiplePrices(zoneId, pricesData) {
    try {
      const response = await api.put(`/zones/${zoneId}/prices/bulk`, {
        prices: pricesData
      });
      return response.data;
    } catch (error) {
      console.error('Error updating multiple prices:', error);
      throw error;
    }
  }

  /**
   * Copiar precios de una zona a otra
   */
  async copyPricesBetweenZones(sourceZoneId, targetZoneId, options = {}) {
    try {
      const response = await api.post(`/zones/${sourceZoneId}/copy-prices`, {
        target_zone_id: targetZoneId,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error copying prices between zones:', error);
      throw error;
    }
  }

  /**
   * Aplicar ajuste porcentual a precios de zona
   */
  async applyPriceAdjustment(zoneId, adjustmentData) {
    try {
      const response = await api.post(`/zones/${zoneId}/adjust-prices`, adjustmentData);
      return response.data;
    } catch (error) {
      console.error('Error applying price adjustment:', error);
      throw error;
    }
  }

  // =================== DASHBOARD Y MÉTRICAS ===================

  /**
   * Obtener estadísticas generales de zonas
   */
  async getZonesStats(period = '30d') {
    try {
      const response = await api.get(`/zones/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching zones stats:', error);
      throw error;
    }
  }

  /**
   * Obtener métricas específicas de una zona
   */
  async getZoneMetrics(zoneId, period = '30d') {
    try {
      const response = await api.get(`/zones/${zoneId}/metrics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching zone metrics:', error);
      throw error;
    }
  }

  /**
   * Obtener comparación entre zonas
   */
  async getZonesComparison(zoneIds, period = '30d') {
    try {
      const response = await api.post('/zones/compare', {
        zone_ids: zoneIds,
        period
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching zones comparison:', error);
      throw error;
    }
  }

  /**
   * Obtener tendencias de precios por zona
   */
  async getPriceTrends(zoneId, period = '90d') {
    try {
      const response = await api.get(`/zones/${zoneId}/price-trends?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching price trends:', error);
      throw error;
    }
  }

  // =================== GEOLOCALIZACIÓN ===================

  /**
   * Obtener zonas con información geográfica para mapa
   */
  async getZonesForMap() {
    try {
      const response = await api.get('/zones/map-data');
      return response.data;
    } catch (error) {
      console.error('Error fetching zones for map:', error);
      throw error;
    }
  }

  /**
   * Buscar zonas por proximidad geográfica
   */
  async findNearbyZones(lat, lng, radius = 50) {
    try {
      const response = await api.get(`/zones/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      return response.data;
    } catch (error) {
      console.error('Error finding nearby zones:', error);
      throw error;
    }
  }

  /**
   * Actualizar coordenadas de una zona
   */
  async updateZoneLocation(zoneId, locationData) {
    try {
      const response = await api.put(`/zones/${zoneId}/location`, locationData);
      return response.data;
    } catch (error) {
      console.error('Error updating zone location:', error);
      throw error;
    }
  }

  // =================== BÚSQUEDAS Y FILTROS ===================

  /**
   * Búsqueda inteligente de zonas
   */
  async searchZones(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      });
      const response = await api.get(`/zones/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching zones:', error);
      throw error;
    }
  }

  /**
   * Obtener zonas activas para select/dropdown
   */
  async getActiveZones() {
    try {
      const response = await api.get('/zones/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active zones:', error);
      throw error;
    }
  }

  // =================== REPORTES ===================

  /**
   * Generar reporte de precios por zona
   */
  async generatePriceReport(zoneId, format = 'excel') {
    try {
      const response = await api.get(`/zones/${zoneId}/reports/prices?format=${format}`, {
        responseType: 'blob'
      });
      
      // Crear y descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-precios-zona-${zoneId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Error generating price report:', error);
      throw error;
    }
  }

  /**
   * Generar reporte de actividad por zona
   */
  async generateActivityReport(zoneId, period = '30d', format = 'pdf') {
    try {
      const response = await api.get(`/zones/${zoneId}/reports/activity?period=${period}&format=${format}`, {
        responseType: 'blob'
      });
      
      // Crear y descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-actividad-zona-${zoneId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Error generating activity report:', error);
      throw error;
    }
  }
}

export default new ZoneService();
