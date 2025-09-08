import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : '/api',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers or common request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios
    const message = error.response?.data?.message || error.message || 'Error desconocido';
    
    switch (error.response?.status) {
      case 400:
        toast.error(`Error de validación: ${message}`);
        break;
      case 401:
        toast.error('No autorizado. Por favor, inicia sesión.');
        // Redirect to login if needed
        break;
      case 403:
        toast.error('No tienes permisos para realizar esta acción.');
        break;
      case 404:
        toast.error('Recurso no encontrado.');
        break;
      case 500:
        toast.error('Error interno del servidor. Por favor, inténtalo más tarde.');
        console.error('Server error:', error.response?.data);
        break;
      default:
        if (error.code === 'ECONNABORTED') {
          toast.error('Tiempo de espera agotado. Verifica tu conexión.');
        } else {
          toast.error(`Error: ${message}`);
        }
    }
    
    return Promise.reject(error);
  }
);

export default api;
