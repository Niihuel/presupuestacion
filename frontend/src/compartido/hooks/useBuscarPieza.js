/**
 * Hook para búsqueda de piezas
 * 
 * Búsqueda optimizada con debounce y filtros:
 * - Búsqueda por texto
 * - Filtro por zona
 * - Cache de resultados
 */

import { useQuery } from '@tanstack/react-query';
import pieceService from '../services/piece.service.js';

/**
 * Hook para búsqueda de piezas con filtros
 */
export const usePieceSearch = (searchTerm, options = {}) => {
  const { zone_id, enabled = true } = options;

  return useQuery({
    queryKey: ['pieces', 'search', { searchTerm, zone_id }],
    // Usa el servicio de piezas con parámetros de búsqueda
    queryFn: async () => {
      const data = await pieceService.getPieces({
        page: 1,
        limit: 50,
        search: searchTerm,
        zone: zone_id,
      });
      return data?.pieces || [];
    },
    enabled: enabled && (searchTerm?.length >= 2 || zone_id),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

export default usePieceSearch;
