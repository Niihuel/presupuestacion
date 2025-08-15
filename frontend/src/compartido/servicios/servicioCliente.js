import api from './api.js';

// Funciones del servicio de customers
const getCustomers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.limit) {
      params.append('limit', filters.limit);
    }

    const queryString = params.toString();
    const url = `/customers${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    // Devolver toda la estructura de datos incluida la paginación
    return response.data.data || { customers: [], pagination: {} };
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener clientes');
  }
};

const getById = async (id) => {
  return getCustomer(id);
};

const getCustomer = async (id) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener cliente');
  }
};

const createCustomer = async (customerData) => {
  try {
    const response = await api.post('/customers', customerData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error(error.response?.data?.message || 'Error al crear cliente');
  }
};

const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error(error.response?.data?.message || 'Error al actualizar cliente');
  }
};

const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new Error(error.response?.data?.message || 'Error al eliminar cliente');
  }
};

// Métodos alias para compatibilidad con hooks
const create = async (customerData) => {
  return createCustomer(customerData);
};

const update = async (id, customerData) => {
  return updateCustomer(id, customerData);
};

const deleteMethod = async (id) => {
  return deleteCustomer(id);
};

const search = async (searchTerm) => {
  return getCustomers({ search: searchTerm });
};

const getStats = async () => {
  try {
    const response = await api.get('/customers/stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
  }
};

// Exportar objeto con todas las funciones
const customerService = {
  getCustomers,
  getById,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  create,
  update,
  delete: deleteMethod, // 'delete' es palabra reservada
  search,
  getStats
};

export default customerService;
