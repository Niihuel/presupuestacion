import api from './api';
import { manejarErrorApi as handleApiError } from '../utilidades/manejarErrorApi';

class DashboardService {
  async getDashboardStats(params = {}) {
    try {
      const response = await api.get('/dashboard/stats', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default new DashboardService();