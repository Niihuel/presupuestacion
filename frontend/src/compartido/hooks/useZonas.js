/**
 * Custom hooks para la gestión completa de zonas
 * 
 * Hooks que encapsulan toda la lógica de gestión de zonas:
 * - CRUD básico
 * - Gestión de precios
 * - Métricas y dashboard
 * - Geolocalización
 * - Reportes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zoneService } from '../servicios';
import { toast } from 'sonner';

// =================== QUERY KEYS ===================
export const zoneKeys = {
  all: ['zones'],
  lists: () => [...zoneKeys.all, 'list'],
  list: (filters) => [...zoneKeys.lists(), { filters }],
  details: () => [...zoneKeys.all, 'detail'],
  detail: (id) => [...zoneKeys.details(), id],
  prices: (zoneId) => [...zoneKeys.detail(zoneId), 'prices'],
  metrics: (zoneId, period) => [...zoneKeys.detail(zoneId), 'metrics', period],
  stats: (period) => [...zoneKeys.all, 'stats', period],
  map: () => [...zoneKeys.all, 'map'],
  comparison: (zoneIds, period) => [...zoneKeys.all, 'comparison', { zoneIds, period }],
  trends: (zoneId, period) => [...zoneKeys.detail(zoneId), 'trends', period],
};

// =================== HOOKS BÁSICOS ===================

/**
 * Hook para obtener lista de zonas con filtros
 */
export const useZones = (filters = {}) => {
  return useQuery({
    queryKey: zoneKeys.list(filters),
    queryFn: () => zoneService.getZones(filters),
    select: (data) => ({
      zones: data?.data || data?.zones || data || [],
      totalPages: data?.totalPages || 1,
      total: data?.total || 0,
      pagination: data?.pagination || null
    }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener zonas activas (para selects)
 */
export const useActiveZones = () => {
  return useQuery({
    queryKey: ['zones', 'active'],
    queryFn: () => zoneService.getActiveZones(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });
};

/**
 * Hook para obtener una zona específica
 */
export const useZone = (id) => {
  return useQuery({
    queryKey: zoneKeys.detail(id),
    queryFn: () => zoneService.getZone(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para búsqueda de zonas
 */
export const useSearchZones = (query, filters = {}) => {
  return useQuery({
    queryKey: ['zones', 'search', { query, ...filters }],
    queryFn: () => zoneService.searchZones(query, filters),
    enabled: query?.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
};

// =================== MUTATIONS BÁSICAS ===================

/**
 * Hook para crear una nueva zona
 */
export const useCreateZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (zoneData) => zoneService.createZone(zoneData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
      queryClient.invalidateQueries({ queryKey: zoneKeys.map() });
      toast.success('Zona creada exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al crear zona';
      toast.error(message);
    },
  });
};

/**
 * Hook para actualizar una zona
 */
export const useUpdateZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => zoneService.updateZone(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(zoneKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
      queryClient.invalidateQueries({ queryKey: zoneKeys.map() });
      toast.success('Zona actualizada exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar zona';
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar una zona
 */
export const useDeleteZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => zoneService.deleteZone(id),
    onSuccess: (data, id) => {
      queryClient.removeQueries({ queryKey: zoneKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
      queryClient.invalidateQueries({ queryKey: zoneKeys.map() });
      toast.success('Zona eliminada exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al eliminar zona';
      toast.error(message);
    },
  });
};

// =================== HOOKS DE PRECIOS ===================

/**
 * Hook para obtener precios de una zona
 */
export const useZonePrices = (zoneId, filters = {}) => {
  return useQuery({
    queryKey: [...zoneKeys.prices(zoneId), filters],
    queryFn: () => zoneService.getZonePrices(zoneId, filters),
    enabled: !!zoneId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para actualizar precio de una pieza
 */
export const useUpdatePiecePrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ zoneId, pieceId, priceData }) => 
      zoneService.updatePiecePrice(zoneId, pieceId, priceData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.prices(variables.zoneId) });
      queryClient.invalidateQueries({ queryKey: zoneKeys.detail(variables.zoneId) });
      toast.success('Precio actualizado exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar precio';
      toast.error(message);
    },
  });
};

/**
 * Hook para actualizar múltiples precios
 */
export const useUpdateMultiplePrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ zoneId, pricesData }) => 
      zoneService.updateMultiplePrices(zoneId, pricesData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.prices(variables.zoneId) });
      queryClient.invalidateQueries({ queryKey: zoneKeys.detail(variables.zoneId) });
      toast.success(`${data.updated_count} precios actualizados exitosamente`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar precios';
      toast.error(message);
    },
  });
};

/**
 * Hook para copiar precios entre zonas
 */
export const useCopyPricesBetweenZones = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceZoneId, targetZoneId, options }) => 
      zoneService.copyPricesBetweenZones(sourceZoneId, targetZoneId, options),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.prices(variables.targetZoneId) });
      queryClient.invalidateQueries({ queryKey: zoneKeys.detail(variables.targetZoneId) });
      toast.success(`${data.copied_count} precios copiados exitosamente`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al copiar precios';
      toast.error(message);
    },
  });
};

/**
 * Hook para aplicar ajuste porcentual a precios
 */
export const useApplyPriceAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ zoneId, adjustmentData }) => 
      zoneService.applyPriceAdjustment(zoneId, adjustmentData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.prices(variables.zoneId) });
      queryClient.invalidateQueries({ queryKey: zoneKeys.detail(variables.zoneId) });
      toast.success(`Ajuste aplicado a ${data.affected_count} precios`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al aplicar ajuste';
      toast.error(message);
    },
  });
};

// =================== HOOKS DE MÉTRICAS ===================

/**
 * Hook para obtener estadísticas generales de zonas
 */
export const useZonesStats = (period = '30d') => {
  return useQuery({
    queryKey: zoneKeys.stats(period),
    queryFn: () => zoneService.getZonesStats(period),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para obtener métricas de una zona específica
 */
export const useZoneMetrics = (zoneId, period = '30d') => {
  return useQuery({
    queryKey: zoneKeys.metrics(zoneId, period),
    queryFn: () => zoneService.getZoneMetrics(zoneId, period),
    enabled: !!zoneId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para comparar métricas entre zonas
 */
export const useZonesComparison = (zoneIds, period = '30d') => {
  return useQuery({
    queryKey: zoneKeys.comparison(zoneIds, period),
    queryFn: () => zoneService.getZonesComparison(zoneIds, period),
    enabled: zoneIds?.length > 1,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener tendencias de precios
 */
export const usePriceTrends = (zoneId, period = '90d') => {
  return useQuery({
    queryKey: zoneKeys.trends(zoneId, period),
    queryFn: () => zoneService.getPriceTrends(zoneId, period),
    enabled: !!zoneId,
    staleTime: 10 * 60 * 1000,
  });
};

// =================== HOOKS DE GEOLOCALIZACIÓN ===================

/**
 * Hook para obtener datos de zonas para mapa
 */
export const useZonesForMap = () => {
  return useQuery({
    queryKey: zoneKeys.map(),
    queryFn: () => zoneService.getZonesForMap(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });
};

/**
 * Hook para buscar zonas cercanas
 */
export const useNearbyZones = (lat, lng, radius = 50) => {
  return useQuery({
    queryKey: ['zones', 'nearby', { lat, lng, radius }],
    queryFn: () => zoneService.findNearbyZones(lat, lng, radius),
    enabled: !!(lat && lng),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para actualizar ubicación de zona
 */
export const useUpdateZoneLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ zoneId, locationData }) => 
      zoneService.updateZoneLocation(zoneId, locationData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(zoneKeys.detail(variables.zoneId), (old) => ({
        ...old,
        ...data
      }));
      queryClient.invalidateQueries({ queryKey: zoneKeys.map() });
      toast.success('Ubicación actualizada exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar ubicación';
      toast.error(message);
    },
  });
};

// =================== HOOKS DE REPORTES ===================

/**
 * Hook para generar reporte de precios
 */
export const useGeneratePriceReport = () => {
  return useMutation({
    mutationFn: ({ zoneId, format }) => 
      zoneService.generatePriceReport(zoneId, format),
    onSuccess: () => {
      toast.success('Reporte generado y descargado exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al generar reporte';
      toast.error(message);
    },
  });
};

/**
 * Hook para generar reporte de actividad
 */
export const useGenerateActivityReport = () => {
  return useMutation({
    mutationFn: ({ zoneId, period, format }) => 
      zoneService.generateActivityReport(zoneId, period, format),
    onSuccess: () => {
      toast.success('Reporte generado y descargado exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al generar reporte';
      toast.error(message);
    },
  });
};

// =================== HOOKS OPTIMISTAS ===================

/**
 * Hook para operaciones optimistas en zonas
 */
export const useOptimisticZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => zoneService.updateZone(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: zoneKeys.detail(id) });
      const previousZone = queryClient.getQueryData(zoneKeys.detail(id));

      queryClient.setQueryData(zoneKeys.detail(id), (old) => ({
        ...old,
        ...data,
      }));

      return { previousZone, id };
    },
    onError: (err, variables, context) => {
      if (context?.previousZone) {
        queryClient.setQueryData(
          zoneKeys.detail(context.id),
          context.previousZone
        );
      }
      toast.error('Error al actualizar zona');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: zoneKeys.lists() });
    },
  });
};
