/**
 * Hook de Calculistas
 * 
 * Gestión de datos de calculistas con React Query
 * para el sistema de presupuestación
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { useNotifications } from './useNotifications';

// Query keys
const QUERY_KEYS = {
  CALCULISTAS: 'calculistas',
  CALCULISTA: 'calculista',
  ACTIVE_CALCULISTAS: 'active-calculistas'
};

/**
 * Hook para obtener todos los calculistas con paginación y filtros
 */
export const useCalculistas = (options = {}) => {
  const { page = 1, limit = 10, search = '', specialty = '', active = 'true' } = options;
  
  return useQuery({
    queryKey: [QUERY_KEYS.CALCULISTAS, { page, limit, search, specialty, active }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(specialty && { specialty }),
        active
      });
      
      const response = await apiService.get(`/calculistas?${params}`);
      return response.data?.data || { calculistas: [], pagination: {} };
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para obtener calculistas activos (para selectores)
 */
export const useActiveCalculistas = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.ACTIVE_CALCULISTAS],
    queryFn: async () => {
      const response = await apiService.get('/calculistas/active');
      return response.data?.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
  });
};

/**
 * Hook para obtener un calculista por ID
 */
export const useCalculista = (id) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CALCULISTA, id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiService.get(`/calculistas/${id}`);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear un nuevo calculista
 */
export const useCreateCalculista = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: async (calculistaData) => {
      const response = await apiService.post('/calculistas', calculistaData);
      return response.data?.data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALCULISTAS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVE_CALCULISTAS] });
      
      success('Calculista creado correctamente');
    },
    onError: (err) => {
      console.error('Error al crear calculista:', err);
      const message = err.response?.data?.message || 'Error al crear el calculista';
      error(message);
    },
  });
};

/**
 * Hook para actualizar un calculista
 */
export const useUpdateCalculista = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/calculistas/${id}`, data);
      return response.data?.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALCULISTAS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVE_CALCULISTAS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALCULISTA, variables.id] });
      
      success('Calculista actualizado correctamente');
    },
    onError: (err) => {
      console.error('Error al actualizar calculista:', err);
      const message = err.response?.data?.message || 'Error al actualizar el calculista';
      error(message);
    },
  });
};

/**
 * Hook para eliminar un calculista
 */
export const useDeleteCalculista = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/calculistas/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALCULISTAS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVE_CALCULISTAS] });
      
      success('Calculista eliminado correctamente');
    },
    onError: (err) => {
      console.error('Error al eliminar calculista:', err);
      const message = err.response?.data?.message || 'Error al eliminar el calculista';
      error(message);
    },
  });
};

/**
 * Hook para toggle activo/inactivo de un calculista
 */
export const useToggleCalculistaStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: async ({ id, active }) => {
      const response = await apiService.patch(`/calculistas/${id}/toggle-status`, { active });
      return response.data?.data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALCULISTAS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVE_CALCULISTAS] });
      
      const status = data.active ? 'activado' : 'desactivado';
      success(`Calculista ${status} correctamente`);
    },
    onError: (err) => {
      console.error('Error al cambiar estado del calculista:', err);
      const message = err.response?.data?.message || 'Error al cambiar el estado del calculista';
      error(message);
    },
  });
};

// Especialidades comunes para calculistas
export const CALCULISTA_SPECIALTIES = [
  'Hormigón Armado',
  'Estructural',
  'Prefabricados',
  'Fundaciones',
  'Puentes',
  'Edificios',
  'Obras Viales',
  'Estructuras Industriales'
];

// Export de todas las funciones
export {
  QUERY_KEYS as CALCULISTA_QUERY_KEYS
};
