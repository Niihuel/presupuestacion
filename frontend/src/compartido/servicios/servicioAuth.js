import api from './api';
import { manejarErrorApi as handleApiError } from '../utilidades/manejarErrorApi';

class AuthService {
  async login(credentials) {
    try {
      console.log('Intentando login con:', { username: credentials.username });
      
      const response = await api.post('/auth/login', credentials);
      console.log('Login exitoso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      const handledError = handleApiError(error);
      throw new Error(handledError.message);
    }
  }

  async register(userData) {
    try {
      console.log('Intentando registro con:', { 
        email: userData.email, 
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName 
      });
      
      const response = await api.post('/auth/register', userData);
      console.log('Registro exitoso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      const handledError = handleApiError(error);
      throw new Error(handledError.message);
    }
  }

  async forgotPassword(email) {
    try {
      console.log('Solicitando reset de password para:', email);
      const response = await api.post('/auth/forgot-password', { email });
      console.log('Reset de password solicitado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en forgot password:', error);
      throw handleApiError(error);
    }
  }

  async resetPassword(data) {
    try {
      console.log('Reseteando password con token');
      const response = await api.post('/auth/reset-password', data);
      console.log('Password reseteado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en reset password:', error);
      throw handleApiError(error);
    }
  }

  async changePassword(data) {
    try {
      console.log('Cambiando password para usuario autenticado');
      const response = await api.post('/auth/change-password', data);
      console.log('Password cambiado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en change password:', error);
      throw handleApiError(error);
    }
  }

  // OAuth2 Authentication
  async loginWithGoogle() {
    try {
      const response = await api.get('/auth/google');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async handleOAuthCallback(searchParams) {
    try {
      const urlParams = new URLSearchParams(searchParams);
      const token = urlParams.get('token');
      const error = urlParams.get('error');
      
      if (error) {
        throw new Error('Error en la autenticación OAuth');
      }
      
      if (!token) {
        throw new Error('Token no encontrado en la respuesta OAuth');
      }
      
      // Simular la respuesta que esperaría el store
      return {
        success: true,
        data: {
          tokens: {
            accessToken: token,
            tokenType: 'Bearer'
          }
        }
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Función de test para verificar conectividad
  async testConnection() {
    try {
      console.log('🔵 Probando conexión con el API...');
      const response = await api.get('/test');
      console.log('Conexión exitosa:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error de conexión:', error);
      throw handleApiError(error);
    }
  }
}

export default new AuthService();