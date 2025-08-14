import api from './api.js';

class QuotationService {
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.customer_id) queryParams.append('customer_id', params.customer_id);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const url = queryParams.toString() ? `/quotations?${queryParams.toString()}` : '/quotations';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching quotations:', error);
      throw error;
    }
  }

  async getQuotations(params = {}) {
    return this.getAll(params);
  }

  async getQuotation(id) {
    try {
      const response = await api.get(`/quotations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quotation:', error);
      throw error;
    }
  }

  async createQuotation(quotationData) {
    try {
      const response = await api.post('/quotations', quotationData);
      return response.data;
    } catch (error) {
      console.error('Error creating quotation:', error);
      throw error;
    }
  }

  async updateQuotation(id, quotationData) {
    try {
      const response = await api.put(`/quotations/${id}`, quotationData);
      return response.data;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  }

  async deleteQuotation(id) {
    try {
      const response = await api.delete(`/quotations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting quotation:', error);
      throw error;
    }
  }

  async duplicateQuotation(id) {
    try {
      const response = await api.post(`/quotations/${id}/duplicate`);
      return response.data;
    } catch (error) {
      console.error('Error duplicating quotation:', error);
      throw error;
    }
  }

  async getQuotationsByCustomer(customerId) {
    try {
      const response = await api.get(`/quotations/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quotations by customer:', error);
      throw error;
    }
  }

  async calculateQuotation(id, { distanceKm } = {}) {
    const params = new URLSearchParams();
    if (distanceKm != null) params.set('distanceKm', distanceKm);
    const { data } = await api.get(`/quotations/${id}/calculate?${params.toString()}`);
    return data?.data || data;
  }
}

export default new QuotationService();
