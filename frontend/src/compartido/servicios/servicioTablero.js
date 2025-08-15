import api from './api';
import { handleApiError } from '../utils/handleApiError';

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