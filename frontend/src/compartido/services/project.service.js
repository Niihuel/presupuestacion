import api from './api.js';

class ProjectService {
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.customer_id) queryParams.append('customer_id', params.customer_id);
      if (params.status_id) queryParams.append('status_id', params.status_id);
      if (params.designer_id) queryParams.append('designer_id', params.designer_id);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const url = queryParams.toString() ? `/proyectos?${queryParams.toString()}` : '/proyectos';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getProjects() {
    try {
      const response = await api.get('/proyectos');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getProject(id) {
    try {
      const response = await api.get(`/proyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  async generateProjectCode() {
    try {
      const response = await api.get('/projects/generate-code');
      return response.data;
    } catch (error) {
      console.error('Error generating project code:', error);
      throw error;
    }
  }

  async createProject(projectData) {
    try {
      const response = await api.post('/proyectos', projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id, projectData) {
    try {
      const response = await api.put(`/proyectos/${id}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      const response = await api.delete(`/proyectos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async getProjectsByCustomer(customerId) {
    try {
      const response = await api.get(`/proyectos/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects by customer:', error);
      throw error;
    }
  }
}

export default new ProjectService();
