/**
 * Custom Hook para Gestión de Piezas
 * 
 * Hook que encapsula la lógica de estado del servidor
 * para las operaciones CRUD de piezas usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pieceService } from '../servicios';
import { toast } from 'sonner';

// Query Keys
export const pieceKeys = {
  all: ['pieces'],
  lists: () => [...pieceKeys.all, 'list'],
  list: (filters) => [...pieceKeys.lists(), { filters }],
  details: () => [...pieceKeys.all, 'detail'],
  detail: (id) => [...pieceKeys.details(), id],
  byZone: (zoneId) => [...pieceKeys.all, 'zone', zoneId],
  prices: (pieceId) => [...pieceKeys.all, 'prices', pieceId],
};

/**
 * Hook para obtener lista de piezas con filtros y paginación
 */
export const usePieces = (params = {}) => {
  const { page = 1, limit = 12, search = '', zone = '', family = '' } = params;
  
  return useQuery({
    queryKey: pieceKeys.list({ page, limit, search, zone, family }),
    queryFn: () => pieceService.getPieces({ page, limit, search, zone, family }),
    staleTime: 30 * 1000, // 30 segundos
    select: (data) => {
      const payload = data?.data || data || {};
      return {
        pieces: payload.pieces || [],
        total: payload.pagination?.totalItems || payload.total || 0,
        totalPages: payload.pagination?.totalPages || payload.totalPages || 0,
        currentPage: payload.pagination?.currentPage || payload.currentPage || 1,
        pagination: payload.pagination || {}
      };
    },
  });
};

/**
 * Hook para obtener una pieza específica
 */
export const usePiece = (id) => {
  return useQuery({
    queryKey: pieceKeys.detail(id),
    queryFn: () => pieceService.getPiece(id),
    enabled: !!id,
  });
};

/**
 * Hook para crear una nueva pieza
 */
export const useCreatePiece = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pieceData) => pieceService.createPiece(pieceData),
    onSuccess: (data) => {
      // Invalidar listas para refrescar
      queryClient.invalidateQueries({ queryKey: pieceKeys.lists() });
      
      toast.success('Pieza creada exitosamente');
    },
    onError: (error) => {
      console.error('Error creating piece:', error);
      toast.error(error.message || 'Error al crear la pieza');
    },
  });
};

/**
 * Hook para actualizar una pieza
 */
export const useUpdatePiece = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => pieceService.updatePiece(id, data),
    onSuccess: (data, variables) => {
      // Actualizar la pieza específica en cache
      queryClient.setQueryData(
        pieceKeys.detail(variables.id),
        data
      );
      
      // Invalidar listas para refrescar
      queryClient.invalidateQueries({ queryKey: pieceKeys.lists() });
      
      toast.success('Pieza actualizada exitosamente');
    },
    onError: (error) => {
      console.error('Error updating piece:', error);
      toast.error(error.message || 'Error al actualizar la pieza');
    },
  });
};

/**
 * Hook para eliminar una pieza
 */
export const useDeletePiece = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => pieceService.deletePiece(id),
    onSuccess: (_, deletedId) => {
      // Remover de cache
      queryClient.removeQueries({ queryKey: pieceKeys.detail(deletedId) });
      
      // Invalidar listas para refrescar
      queryClient.invalidateQueries({ queryKey: pieceKeys.lists() });
      
      toast.success('Pieza eliminada exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting piece:', error);
      toast.error(error.message || 'Error al eliminar la pieza');
    },
  });
};

/**
 * Hook para obtener piezas por zona
 */
export const usePiecesByZone = (zoneId) => {
  return useQuery({
    queryKey: pieceKeys.byZone(zoneId),
    queryFn: () => pieceService.getPiecesByZone(zoneId),
    enabled: !!zoneId,
    select: (data) => data?.pieces || data || [],
  });
};

/**
 * Hook para obtener precios de una pieza
 */
export const usePiecePrices = (pieceId) => {
  return useQuery({
    queryKey: pieceKeys.prices(pieceId),
    queryFn: () => pieceService.getPiecePrices(pieceId),
    enabled: !!pieceId,
    select: (data) => data?.prices || data || [],
  });
};

/**
 * Hook para actualizar precios de una pieza
 */
export const useUpdatePiecePrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pieceId, priceData }) => pieceService.updatePiecePrice(pieceId, priceData),
    onSuccess: (data, variables) => {
      const { pieceId } = variables;
      
      // Invalidar precios específicos
      queryClient.invalidateQueries({ queryKey: pieceKeys.prices(pieceId) });
      
      // Invalidar pieza específica
      queryClient.invalidateQueries({ queryKey: pieceKeys.detail(pieceId) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: pieceKeys.lists() });
      
      toast.success('Precios actualizados exitosamente');
    },
    onError: (error) => {
      console.error('Error updating piece prices:', error);
      toast.error(error.message || 'Error al actualizar los precios');
    },
  });
};

/**
 * Hook para búsqueda avanzada de piezas
 */
export const useSearchPieces = (searchParams) => {
  return useQuery({
    queryKey: [...pieceKeys.all, 'search', searchParams],
    queryFn: () => pieceService.searchPieces(searchParams),
    enabled: !!(searchParams.query || searchParams.category || searchParams.zone),
    staleTime: 30 * 1000, // 30 segundos
  });
};

/**
 * Hook para obtener estadísticas de piezas
 */
export const usePieceStats = () => {
  return useQuery({
    queryKey: [...pieceKeys.all, 'stats'],
    queryFn: () => pieceService.getPieceStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
