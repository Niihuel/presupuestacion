/**
 * Hook para manejo de fórmulas de materiales por pieza
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialService } from '../servicios/servicioMaterial';
import { useNotifications } from './useNotificaciones';

export const usePieceMaterialFormula = (pieceId) => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  // Query para obtener fórmula de una pieza
  const formulaQuery = useQuery({
    queryKey: ['piece-material-formula', pieceId],
    queryFn: () => materialService.getPieceFormula(pieceId),
    enabled: !!pieceId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para actualizar fórmula completa
  const updateFormulaMutation = useMutation({
    mutationFn: ({ pieceId, materials }) => 
      materialService.updatePieceFormula(pieceId, materials),
    onSuccess: () => {
      queryClient.invalidateQueries(['piece-material-formula', pieceId]);
      queryClient.invalidateQueries(['pieces']);
      success('Fórmula de materiales actualizada correctamente');
    },
    onError: (err) => {
      error(err.message || 'Error al actualizar la fórmula');
    }
  });

  // Mutation para agregar material individual
  const addMaterialMutation = useMutation({
    mutationFn: ({ pieceId, materialData }) => 
      materialService.addMaterialToFormula(pieceId, materialData),
    onSuccess: () => {
      queryClient.invalidateQueries(['piece-material-formula', pieceId]);
      success('Material agregado a la fórmula');
    },
    onError: (err) => {
      error(err.message || 'Error al agregar material');
    }
  });

  // Mutation para remover material
  const removeMaterialMutation = useMutation({
    mutationFn: ({ pieceId, materialId }) => 
      materialService.removeMaterialFromFormula(pieceId, materialId),
    onSuccess: () => {
      queryClient.invalidateQueries(['piece-material-formula', pieceId]);
      success('Material removido de la fórmula');
    },
    onError: (err) => {
      error(err.message || 'Error al remover material');
    }
  });

  // Mutation para copiar fórmula
  const copyFormulaMutation = useMutation({
    mutationFn: ({ sourceId, targetId }) => 
      materialService.copyPieceFormula(sourceId, targetId),
    onSuccess: (_, { targetId }) => {
      queryClient.invalidateQueries(['piece-material-formula', targetId]);
      success('Fórmula copiada correctamente');
    },
    onError: (err) => {
      error(err.message || 'Error al copiar fórmula');
    }
  });

  // Función para validar fórmula
  const validateFormula = async (materials) => {
    try {
      const response = await materialService.validatePieceFormula(pieceId, materials);
      return response.data || response;
    } catch (err) {
      error(err.message || 'Error al validar fórmula');
      return { valid: false, errors: [err.message] };
    }
  };

  return {
    // Data
    formula: formulaQuery.data?.data || [],
    isLoading: formulaQuery.isLoading,
    isError: formulaQuery.isError,
    error: formulaQuery.error,

    // Actions
    updateFormula: updateFormulaMutation.mutateAsync,
    addMaterial: addMaterialMutation.mutateAsync,
    removeMaterial: removeMaterialMutation.mutateAsync,
    copyFormula: copyFormulaMutation.mutateAsync,
    validateFormula,

    // States
    isUpdating: updateFormulaMutation.isPending,
    isAdding: addMaterialMutation.isPending,
    isRemoving: removeMaterialMutation.isPending,
    isCopying: copyFormulaMutation.isPending,

    // Refetch
    refetch: formulaQuery.refetch
  };
};

export const useMaterialUsageStats = () => {
  return useQuery({
    queryKey: ['material-usage-stats'],
    queryFn: () => materialService.getMaterialUsageStats(),
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
};

export const usePiecesUsingMaterial = (materialId) => {
  return useQuery({
    queryKey: ['pieces-using-material', materialId],
    queryFn: () => materialService.getPiecesUsingMaterial(materialId),
    enabled: !!materialId,
    staleTime: 10 * 60 * 1000,
  });
};

export const useSimilarFormulas = (pieceId) => {
  return useQuery({
    queryKey: ['similar-formulas', pieceId],
    queryFn: () => materialService.findSimilarFormulas(pieceId),
    enabled: !!pieceId,
    staleTime: 20 * 60 * 1000, // 20 minutos
  });
};
