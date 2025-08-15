/**
 * Hook de Plantas (usa Zones internamente)
 * 
 * Este hook mantiene la interfaz de "plantas" pero internamente
 * usa el sistema unificado de zones para evitar duplicación
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../servicios/api';
import { useNotifications } from './useNotificaciones';

// Query keys
const QUERY_KEYS = {
  PLANTAS: 'plantas',
  PLANTA: 'planta',
  ACTIVE_PLANTAS: 'active-plantas',
  NEAREST_PLANTA: 'nearest-planta'
};

/**
 * Hook para obtener todas las plantas con paginación y filtros
 */
export const usePlantas = (options = {}) => {
  const { page = 1, limit = 10, search = '', active = 'true' } = options;
  
  return useQuery({
    queryKey: [QUERY_KEYS.PLANTAS, { page, limit, search, active }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        active
      });
      
      const response = await apiService.get(`/zones?${params}`);
      return response.data?.data || { plantas: [], pagination: {} };
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para obtener plantas activas (para selectores)
 */
export const useActivePlantas = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.ACTIVE_PLANTAS],
    queryFn: async () => {
      const response = await apiService.get('/zones/active');
      return response.data?.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
  });
};

/**
 * Hook para obtener una planta por ID
 */
export const usePlanta = (id) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PLANTA, id],
    queryFn: async () => {
      const response = await apiService.get(`/zones/${id}`);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para buscar la planta más cercana
 */
export const useNearestPlanta = (latitude, longitude) => {
  return useQuery({
    queryKey: [QUERY_KEYS.NEAREST_PLANTA, latitude, longitude],
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString()
      });
      
      const response = await apiService.get(`/zones/nearest?${params}`);
      return response.data?.data;
    },
    enabled: !!(latitude && longitude),
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para crear una nueva planta
 */
export const useCreatePlanta = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (plantaData) => {
      const response = await apiService.post('/zones', plantaData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries([QUERY_KEYS.PLANTAS]);
      queryClient.invalidateQueries([QUERY_KEYS.ACTIVE_PLANTAS]);
      showNotification({
        type: 'success',
        title: 'Planta creada',
        message: data.message || 'La planta ha sido creada correctamente'
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al crear la planta';
      showNotification({
        type: 'error',
        title: 'Error',
        message
      });
    }
  });
};

/**
 * Hook para actualizar una planta
 */
export const useUpdatePlanta = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async ({ id, ...plantaData }) => {
      const response = await apiService.put(`/zones/${id}`, plantaData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([QUERY_KEYS.PLANTAS]);
      queryClient.invalidateQueries([QUERY_KEYS.ACTIVE_PLANTAS]);
      queryClient.invalidateQueries([QUERY_KEYS.PLANTA, variables.id]);
      showNotification({
        type: 'success',
        title: 'Planta actualizada',
        message: data.message || 'La planta ha sido actualizada correctamente'
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar la planta';
      showNotification({
        type: 'error',
        title: 'Error',
        message
      });
    }
  });
};

/**
 * Hook para eliminar una planta
 */
export const useDeletePlanta = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (id) => {
      const response = await apiService.put(`/zones/${id}`, { is_active: false });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries([QUERY_KEYS.PLANTAS]);
      queryClient.invalidateQueries([QUERY_KEYS.ACTIVE_PLANTAS]);
      showNotification({
        type: 'success',
        title: 'Planta eliminada',
        message: data.message || 'La planta ha sido eliminada correctamente'
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al eliminar la planta';
      showNotification({
        type: 'error',
        title: 'Error',
        message
      });
    }
  });
};

/**
 * Hook para cambiar el estado activo/inactivo de una planta
 */
export const useTogglePlantaStatus = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async (id) => {
      const response = await apiService.put(`/zones/${id}`, { is_active: !active });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries([QUERY_KEYS.PLANTAS]);
      queryClient.invalidateQueries([QUERY_KEYS.ACTIVE_PLANTAS]);
      showNotification({
        type: 'success',
        title: 'Estado cambiado',
        message: data.message || 'El estado de la planta ha sido cambiado correctamente'
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al cambiar el estado de la planta';
      showNotification({
        type: 'error',
        title: 'Error',
        message
      });
    }
  });
};

/**
 * Hook para calcular distancia desde una planta
 */
export const useCalculateDistance = () => {
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async ({ plantaId, latitude, longitude }) => {
      const response = await apiService.get(`/zones/${plantaId}/distance`, {
        params: { lat: latitude, lng: longitude }
      });
      return response.data;
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al calcular la distancia';
      showNotification({
        type: 'error',
        title: 'Error',
        message
      });
    }
  });
};
