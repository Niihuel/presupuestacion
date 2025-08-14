import api from './api.js';

class PieceService {
  async getPieces(params = {}) {
    try {
      const response = await api.get('/pieces', { params });
      // Normalizar estructura: backend envía { success, data: { pieces, pagination } }
      const payload = response?.data?.data || response?.data || {};
      // Si ya viene plano con pieces, respetar
      if (payload.pieces && payload.pagination) return payload;
      // Si viene como array, envolver
      if (Array.isArray(payload)) return { pieces: payload, pagination: {} };
      return payload;
    } catch (error) {
      console.error('Error fetching pieces:', error);
      throw error;
    }
  }

  async getPiece(id) {
    try {
      const response = await api.get(`/pieces/${id}`);
      return response?.data?.data || response?.data;
    } catch (error) {
      console.error('Error fetching piece:', error);
      throw error;
    }
  }

  async createPiece(pieceData) {
    try {
      const response = await api.post('/pieces', pieceData);
      return response.data;
    } catch (error) {
      console.error('Error creating piece:', error);
      throw error;
    }
  }

  async updatePiece(id, pieceData) {
    try {
      const response = await api.put(`/pieces/${id}`, pieceData);
      return response.data;
    } catch (error) {
      console.error('Error updating piece:', error);
      throw error;
    }
  }

  async deletePiece(id) {
    try {
      const response = await api.delete(`/pieces/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting piece:', error);
      throw error;
    }
  }

  async getPiecesByZone(zoneId) {
    try {
      const response = await api.get(`/pieces/zone/${zoneId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pieces by zone:', error);
      throw error;
    }
  }

  async getPiecePrices(pieceId) {
    try {
      const response = await api.get(`/pieces/${pieceId}/prices`);
      return response.data;
    } catch (error) {
      console.error('Error fetching piece prices:', error);
      throw error;
    }
  }

  async updatePiecePrice(pieceId, priceData) {
    try {
      const response = await api.put(`/pieces/${pieceId}/prices`, priceData);
      return response.data;
    } catch (error) {
      console.error('Error updating piece price:', error);
      throw error;
    }
  }

  async generatePieceCode() {
    try {
      const response = await api.get('/pieces/generate-code');
      return response.data;
    } catch (error) {
      console.error('Error generating piece code:', error);
      throw error;
    }
  }

  // ==============================
  // TVF v2: cálculo completo y publicación
  // ==============================

  /**
   * Calcular precio usando TVF v2 con desglose completo
   * @param {number} pieceId - ID de la pieza
   * @param {number} zoneId - ID de la zona
   * @param {string} asOfDate - Fecha para cálculo (YYYY-MM-DD)
   * @param {boolean} compare - Si incluir comparación con mes anterior
   * @returns {Promise} Desglose de costos y comparación
   */
  async calculatePiecePrice(pieceId, zoneId, asOfDate = null, compare = false) {
    try {
      const params = {
        zone_id: zoneId,
        as_of_date: asOfDate || new Date().toISOString().split('T')[0],
        compare: compare
      };
      
      const response = await api.get(`/pieces/${pieceId}/calculate-price`, { params });
      return response?.data;
    } catch (error) {
      console.error('Error calculating piece price:', error);
      throw error;
    }
  }

  /**
   * Publicar precio de pieza para una fecha efectiva
   * @param {number} pieceId - ID de la pieza
   * @param {object} data - Datos de publicación
   * @returns {Promise} Resultado de publicación
   */
  async publishPiecePrice(pieceId, data) {
    try {
      const response = await api.post(`/pieces/${pieceId}/publish-price`, data);
      return response?.data;
    } catch (error) {
      console.error('Error publishing piece price:', error);
      throw error;
    }
  }

  /**
   * Obtener histórico de precios de una pieza
   * @param {number} pieceId - ID de la pieza
   * @param {number} zoneId - ID de la zona (opcional)
   * @param {number} limit - Límite de registros
   * @returns {Promise} Histórico con deltas
   */
  async getPieceHistory(pieceId, zoneId = null, limit = 12) {
    try {
      const params = { limit };
      if (zoneId) params.zone_id = zoneId;
      
      const response = await api.get(`/pieces/${pieceId}/history`, { params });
      return response?.data;
    } catch (error) {
      console.error('Error fetching piece history:', error);
      throw error;
    }
  }

  // Legacy support (TVF v1)
  async getTVFPrice(pieceId, { zone_id, as_of = null }) {
    try {
      const response = await api.get(`/pieces/${pieceId}/price`, { params: { zone_id, as_of } });
      return response?.data?.data || null;
    } catch (error) {
      console.error('Error calculating TVF price:', error);
      throw error;
    }
  }
}

export default new PieceService();
