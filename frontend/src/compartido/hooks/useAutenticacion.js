/**
 * Custom hooks para la gestión de autenticación
 * 
 * Hooks que encapsulan la lógica de estado del servidor
 * para las operaciones de autenticación usando React Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@compartido/servicios';
import { useAuthStore } from '@nucleo/store/auth.store';
import { toast } from 'sonner';

/**
 * Hook para login
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login: loginStore } = useAuthStore();

  return useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      // Guardar usuario, token y permisos efectivos si backend los retorna
      loginStore({
        user: data.user,
        token: data.token,
        permissions: data.permissions || {}
      });
      
      // Limpiar cache al hacer login
      queryClient.clear();
      
      toast.success('Sesión iniciada exitosamente');
    },
    onError: (error) => {
      const message = error.message || 'Error al iniciar sesión';
      toast.error(message);
    },
  });
};

/**
 * Hook para registro
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: (userData) => authService.register(userData),
    onSuccess: () => {
      toast.success('Usuario registrado exitosamente. Esperando aprobación del administrador.');
    },
    onError: (error) => {
      const message = error.message || 'Error al registrar usuario';
      toast.error(message);
    },
  });
};

/**
 * Hook para logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout: logoutStore } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Limpiar store
      logoutStore();
      
      // Limpiar todo el cache
      queryClient.clear();
      
      toast.success('Sesión cerrada exitosamente');
    },
    onError: (error) => {
      // Aunque falle el logout en el servidor, limpiar localmente
      logoutStore();
      queryClient.clear();
      
      const message = error.message || 'Error al cerrar sesión';
      toast.error(message);
    },
  });
};

/**
 * Hook para cambiar contraseña
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwordData) => authService.changePassword(passwordData),
    onSuccess: () => {
      toast.success('Contraseña cambiada exitosamente');
    },
    onError: (error) => {
      const message = error.message || 'Error al cambiar contraseña';
      toast.error(message);
    },
  });
};

/**
 * Hook para solicitar reset de contraseña
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email) => authService.forgotPassword(email),
    onSuccess: () => {
      toast.success('Se ha enviado un enlace de recuperación a tu email');
    },
    onError: (error) => {
      const message = error.message || 'Error al solicitar recuperación';
      toast.error(message);
    },
  });
};

/**
 * Hook para reset de contraseña
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data) => authService.resetPassword(data),
    onSuccess: () => {
      toast.success('Contraseña restablecida exitosamente');
    },
    onError: (error) => {
      const message = error.message || 'Error al restablecer contraseña';
      toast.error(message);
    },
  });
};
