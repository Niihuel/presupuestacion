import axios from 'axios';
import { useAuthStore } from '@nucleo/store/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Para enviar cookies en las solicitudes
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar la expiración del token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Intentar refrescar el token
        const { accessToken } = await api.post('/auth/refresh-token');
        useAuthStore.getState().setToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh token falla, desloguear al usuario
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;