/**
 * Hook para gestión de materiales
 * 
 * Proporciona funcionalidades completas para:
 * - CRUD de materiales
 * - Gestión de stock por planta
 * - Control de precios por proveedor
 * - Estadísticas y métricas
 * - Historial de precios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialService } from '../servicios/servicioMaterial';

// Keys para React Query
const QUERY_KEYS = {
  MATERIALS: 'materials',
  MATERIAL: 'material',
  MATERIALS_STATS: 'materials-stats',
  MATERIAL_PRICE_HISTORY: 'material-price-history',
  MATERIAL_STOCK_BY_PLANT: 'material-stock-by-plant'
};

/**
 * Hook para obtener lista de materiales con filtros
 */
export const useMaterials = (params = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MATERIALS, params],
    queryFn: () => materialService.getMaterials(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para obtener un material específico
 */
export const useMaterial = (materialId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MATERIAL, materialId],
    queryFn: () => materialService.getMaterial(materialId),
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener estadísticas de materiales
 */
export const useMaterialsStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.MATERIALS_STATS],
    queryFn: () => materialService.getMaterialsStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para obtener historial de precios de un material
 */
export const useMaterialPriceHistory = (materialId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MATERIAL_PRICE_HISTORY, materialId],
    queryFn: () => materialService.getMaterialPriceHistory(materialId),
    enabled: !!materialId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener stock de un material por planta
 */
export const useMaterialStockByPlant = (materialId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MATERIAL_STOCK_BY_PLANT, materialId],
    queryFn: () => materialService.getMaterialStockByPlant(materialId),
    enabled: !!materialId,
    staleTime: 1 * 60 * 1000, // 1 minuto (más frecuente para stock)
  });
};

/**
 * Hook para crear un nuevo material
 */
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: materialService.createMaterial,
    onSuccess: (data) => {
      // Invalidar y refrescar las queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS_STATS] });
      
      // Cachear el nuevo material
      queryClient.setQueryData([QUERY_KEYS.MATERIAL, data.id], data);
    },
    onError: (error) => {
      console.error('Error creating material:', error);
    },
  });
};

/**
 * Hook para actualizar un material
 */
export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) => materialService.updateMaterial(id, data),
    onSuccess: (data, variables) => {
      // Actualizar las queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS_STATS] });
      
      // Actualizar el material específico en caché
      queryClient.setQueryData([QUERY_KEYS.MATERIAL, variables.id], data);
    },
    onError: (error) => {
      console.error('Error updating material:', error);
    },
  });
};

/**
 * Hook para eliminar un material
 */
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: materialService.deleteMaterial,
    onSuccess: (_, materialId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS_STATS] });
      
      // Remover el material específico del caché
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.MATERIAL, materialId] });
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.MATERIAL_STOCK_BY_PLANT, materialId] });
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.MATERIAL_PRICE_HISTORY, materialId] });
    },
    onError: (error) => {
      console.error('Error deleting material:', error);
    },
  });
};

/**
 * Hook para actualizar stock de un material en una planta
 */
export const useUpdateMaterialStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ materialId, plantId, stockData }) => 
      materialService.updateMaterialStock(materialId, plantId, stockData),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS_STATS] });
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.MATERIAL_STOCK_BY_PLANT, variables.materialId] 
      });
      
      // Actualizar el material en caché
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.MATERIAL, variables.materialId] 
      });
    },
    onError: (error) => {
      console.error('Error updating material stock:', error);
    },
  });
};

/**
 * Hook para actualizar precio de un material
 */
export const useUpdateMaterialPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ materialId, plantId, priceData }) => 
      materialService.updateMaterialPrice(materialId, plantId, priceData),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS_STATS] });
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.MATERIAL_PRICE_HISTORY, variables.materialId] 
      });
      
      // Actualizar el material en caché
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.MATERIAL, variables.materialId] 
      });
    },
    onError: (error) => {
      console.error('Error updating material price:', error);
    },
  });
};

/**
 * Hook para importar materiales desde archivo
 */
export const useImportMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: materialService.importMaterials,
    onSuccess: () => {
      // Refrescar todas las queries de materiales
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS_STATS] });
    },
    onError: (error) => {
      console.error('Error importing materials:', error);
    },
  });
};

/**
 * Hook para exportar materiales
 */
export const useExportMaterials = () => {
  return useMutation({
    mutationFn: materialService.exportMaterials,
    onError: (error) => {
      console.error('Error exporting materials:', error);
    },
  });
};

/**
 * Hook para obtener materiales disponibles para una pieza
 */
export const useMaterialsForPiece = (pieceId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MATERIALS, 'for-piece', pieceId],
    queryFn: () => materialService.getMaterialsForPiece(pieceId),
    enabled: !!pieceId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener fórmula de materiales de una pieza
 */
export const usePieceMaterialFormula = (pieceId) => {
  return useQuery({
    queryKey: ['piece-material-formula', pieceId],
    queryFn: () => materialService.getPieceMaterialFormula(pieceId),
    enabled: !!pieceId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para actualizar fórmula de materiales de una pieza
 */
export const useUpdatePieceMaterialFormula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pieceId, formula }) => 
      materialService.updatePieceMaterialFormula(pieceId, formula),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['piece-material-formula', variables.pieceId] 
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATERIALS] });
    },
    onError: (error) => {
      console.error('Error updating piece material formula:', error);
    },
  });
};
