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
  // TVF v1: cálculo y publicación
  // ==============================

  async getTVFPrice(pieceId, { zone_id, as_of = null }) {
    try {
      const response = await api.get(`/pieces/${pieceId}/price`, { params: { zone_id, as_of } });
      return response?.data?.data || null;
    } catch (error) {
      console.error('Error calculating TVF price:', error);
      throw error;
    }
  }

  async publishPiecePrice(pieceId, { zone_id, as_of = null, effective_date = null }) {
    try {
      const response = await api.post(`/pieces/${pieceId}/publish-price`, { zone_id, as_of, effective_date });
      return response?.data;
    } catch (error) {
      console.error('Error publishing piece price:', error);
      throw error;
    }
  }
}

export default new PieceService();
