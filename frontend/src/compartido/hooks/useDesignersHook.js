/**
 * Hook de Diseñadores
 * 
 * Gestión de datos de diseñadores/usuarios con React Query
 * para el sistema de presupuestación
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { useNotifications } from './useNotifications';

// Query keys
const QUERY_KEYS = {
  DESIGNERS: 'designers',
  DESIGNER: 'designer',
  USERS: 'users'
};

/**
 * Hook para obtener todos los diseñadores/usuarios
 */
export const useDesigners = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DESIGNERS, options],
    queryFn: async () => {
      const response = await apiService.get('/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    ...options
  });
};

/**
 * Hook para obtener un diseñador específico
 */
export const useDesigner = (id, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DESIGNER, id],
    queryFn: async () => {
      const response = await apiService.get(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options
  });
};

/**
 * Hook para crear un nuevo diseñador/usuario
 */
export const useCreateDesigner = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await apiService.post('/users', userData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar y refetch la lista
      queryClient.invalidateQueries([QUERY_KEYS.DESIGNERS]);
      
      // Agregar al cache
      queryClient.setQueriesData([QUERY_KEYS.DESIGNERS], (oldData) => {
        return oldData ? [...oldData, data] : [data];
      });
      
      success('Diseñador creado correctamente.');
    },
    onError: (err) => {
      console.error('Error al crear diseñador:', err);
      error('Error al crear el diseñador');
    }
  });
};

/**
 * Hook para actualizar un diseñador
 */
export const useUpdateDesigner = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { id } = variables;
      
      // Actualizar en el cache
      queryClient.setQueryData([QUERY_KEYS.DESIGNER, id], data);
      
      // Actualizar la lista
      queryClient.setQueriesData([QUERY_KEYS.DESIGNERS], (oldData) => {
        return oldData ? oldData.map(designer => 
          designer.id === id ? { ...designer, ...data } : designer
        ) : [];
      });
      
      queryClient.invalidateQueries([QUERY_KEYS.DESIGNERS]);
      success('Diseñador actualizado correctamente.');
    },
    onError: (err) => {
      console.error('Error al actualizar diseñador:', err);
      error('Error al actualizar el diseñador');
    }
  });
};

/**
 * Hook para eliminar un diseñador
 */
export const useDeleteDesigner = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      // Remover de la lista
      queryClient.setQueriesData([QUERY_KEYS.DESIGNERS], (oldData) => {
        return oldData ? oldData.filter(designer => designer.id !== deletedId) : [];
      });
      
      // Remover del cache específico
      queryClient.removeQueries([QUERY_KEYS.DESIGNER, deletedId]);
      
      queryClient.invalidateQueries([QUERY_KEYS.DESIGNERS]);
      success('Diseñador eliminado correctamente.');
    },
    onError: (err) => {
      console.error('Error al eliminar diseñador:', err);
      error('Error al eliminar el diseñador');
    }
  });
};

/**
 * Hook para obtener diseñadores activos
 */
export const useActiveDesigners = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DESIGNERS, 'active'],
    queryFn: async () => {
      const response = await apiService.get('/users', {
        params: { status: 'active' }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options
  });
};

/**
 * Hook para búsqueda de diseñadores
 */
export const useSearchDesigners = (searchTerm, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DESIGNERS, 'search', searchTerm],
    queryFn: async () => {
      const response = await apiService.get('/users/search', {
        params: { q: searchTerm }
      });
      return response.data;
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
    ...options
  });
};

/**
 * Hook para obtener estadísticas de diseñadores
 */
export const useDesignersStats = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DESIGNERS, 'stats'],
    queryFn: async () => {
      const response = await apiService.get('/users/stats');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    ...options
  });
};
