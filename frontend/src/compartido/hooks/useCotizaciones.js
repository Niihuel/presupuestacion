/**
 * Hook para gestión de presupuestos/cotizaciones
 * 
 * Sistema inteligente de presupuestación con flujo Kanban integrado,
 * guardado progresivo y wizard paso a paso
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import quotationService from '../services/quotation.service';
import { useNotifications } from './useNotifications';

// Query keys
const QUERY_KEYS = {
  QUOTATIONS: 'quotations',
  QUOTATION: 'quotation',
  QUOTATION_ITEMS: 'quotation-items',
  QUOTATION_VERSIONS: 'quotation-versions',
  QUOTATION_PDF: 'quotation-pdf'
};

// Estados de presupuesto (alineados con flujo Kanban)
export const QUOTATION_STATUSES = {
  DRAFT: { 
    id: 1, 
    name: 'Borrador', 
    description: 'Información básica capturada',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    canEdit: true,
    requiredFields: ['customer_id', 'project_name']
  },
  QUOTING: { 
    id: 2, 
    name: 'En Cotización', 
    description: 'Selección de piezas y cálculos',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    canEdit: true,
    requiredFields: ['customer_id', 'project_name', 'items']
  },
  REVIEWING: { 
    id: 3, 
    name: 'En Revisión', 
    description: 'Presupuesto completo, revisión interna',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    canEdit: true,
    requiredFields: ['customer_id', 'project_name', 'items', 'total']
  },
  SENT: { 
    id: 4, 
    name: 'Enviado al Cliente', 
    description: 'Presentado al cliente',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    canEdit: false,
    requiredFields: ['customer_id', 'project_name', 'items', 'total', 'sent_date']
  },
  APPROVED: { 
    id: 5, 
    name: 'Aprobado', 
    description: 'Cliente aprobó el presupuesto',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    canEdit: false,
    requiredFields: ['customer_id', 'project_name', 'items', 'total', 'sent_date', 'approved_date']
  },
  REJECTED: { 
    id: 6, 
    name: 'Rechazado', 
    description: 'Cliente rechazó el presupuesto',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    canEdit: false,
    requiredFields: ['customer_id', 'project_name', 'items', 'total', 'sent_date', 'rejected_date']
  }
};

// Pasos del wizard (corresponden a los estados)
export const WIZARD_STEPS = {
  BASIC_INFO: { 
    id: 1, 
    name: 'Información Básica',
    description: 'Cliente, proyecto y datos generales',
    status: QUOTATION_STATUSES.DRAFT,
    component: 'BasicInfoStep'
  },
  PIECES_SELECTION: { 
    id: 2, 
    name: 'Selección de Piezas',
    description: 'Búsqueda y selección de componentes',
    status: QUOTATION_STATUSES.QUOTING,
    component: 'PiecesSelectionStep'
  },
  CALCULATIONS: { 
    id: 3, 
    name: 'Cálculos y Totales',
    description: 'Verificación de cálculos y ajustes',
    status: QUOTATION_STATUSES.REVIEWING,
    component: 'CalculationsStep'
  },
  PREVIEW: { 
    id: 4, 
    name: 'Vista Previa',
    description: 'Revisión final antes de enviar',
    status: QUOTATION_STATUSES.SENT,
    component: 'PreviewStep'
  }
};

/**
 * Hook para obtener todos los presupuestos con filtros
 */
export const useQuotations = (params = {}) => {
  const { 
    page = 1, 
    limit = 12, 
    search = '', 
    customerId = '', 
    status = '', 
    dateFrom = '',
    dateTo = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = params;

  return useQuery({
    queryKey: [QUERY_KEYS.QUOTATIONS, { page, limit, search, customerId, status, dateFrom, dateTo, sortBy, sortOrder }],
    queryFn: () => quotationService.getQuotations({
      page,
      limit,
      search,
      customer_id: customerId,
      status_id: status,
      date_from: dateFrom,
      date_to: dateTo,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => ({
      quotations: data.quotations || [],
      pagination: {
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        totalItems: data.totalItems || 0,
        limit: data.limit || 12
      },
      stats: {
        totalQuotations: data.totalQuotations || 0,
        byStatus: data.statusCounts || {},
        totalValue: data.totalValue || 0,
        averageValue: data.averageValue || 0
      }
    })
  });
};

/**
 * Hook para obtener un presupuesto específico con detalles completos
 */
export const useQuotation = (quotationId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.QUOTATION, quotationId],
    queryFn: () => quotationService.getQuotation(quotationId),
    enabled: !!quotationId,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
};

/**
 * Hook para crear nuevo presupuesto (siempre inicia como borrador)
 */
export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: (quotationData) => {
      // Asegurar que inicie como borrador
      const draftData = {
        ...quotationData,
        status_id: QUOTATION_STATUSES.DRAFT.id,
        is_draft: true
      };
      return quotationService.createQuotation(draftData);
    },
    onSuccess: (newQuotation) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATIONS] });
      success(`Presupuesto "${newQuotation.project_name}" creado como borrador.`);
    },
    onError: (err) => {
      console.error('Error al crear presupuesto:', err);
      error(err.response?.data?.message || 'Error al crear el presupuesto.');
    }
  });
};

/**
 * Hook para actualizar presupuesto (guardado progresivo)
 */
export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, data, silent = false }) => quotationService.updateQuotation(id, data),
    onSuccess: (updatedQuotation, { silent }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATION, updatedQuotation.id] });
      
      if (!silent) {
        success('Presupuesto actualizado correctamente.');
      }
    },
    onError: (err) => {
      console.error('Error al actualizar presupuesto:', err);
      error(err.response?.data?.message || 'Error al actualizar el presupuesto.');
    }
  });
};

/**
 * Hook para avanzar presupuesto al siguiente paso/estado
 */
export const useAdvanceQuotation = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ quotationId, targetStatus, data = {} }) => {
      return quotationService.advanceQuotationStatus(quotationId, targetStatus, data);
    },
    onSuccess: (updatedQuotation) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATION, updatedQuotation.id] });
      
      const status = Object.values(QUOTATION_STATUSES).find(s => s.id === updatedQuotation.status_id);
      success(`Presupuesto movido a "${status?.name}".`);
    },
    onError: (err) => {
      console.error('Error al avanzar presupuesto:', err);
      error(err.response?.data?.message || 'Error al avanzar el presupuesto.');
    }
  });
};

/**
 * Hook para clonar/duplicar presupuesto
 */
export const useCloneQuotation = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: (quotationId) => quotationService.cloneQuotation(quotationId),
    onSuccess: (clonedQuotation) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATIONS] });
      success(`Presupuesto clonado como "${clonedQuotation.project_name}".`);
    },
    onError: (err) => {
      console.error('Error al clonar presupuesto:', err);
      error(err.response?.data?.message || 'Error al clonar el presupuesto.');
    }
  });
};

/**
 * Hook para eliminar presupuesto
 */
export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: (quotationId) => quotationService.deleteQuotation(quotationId),
    onSuccess: (_, quotationId) => {
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.QUOTATION, quotationId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATIONS] });
      success('Presupuesto eliminado correctamente.');
    },
    onError: (err) => {
      console.error('Error al eliminar presupuesto:', err);
      error(err.response?.data?.message || 'Error al eliminar el presupuesto.');
    }
  });
};

/**
 * Hook para obtener items del presupuesto
 */
export const useQuotationItems = (quotationId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.QUOTATION_ITEMS, quotationId],
    queryFn: () => quotationService.getQuotation(quotationId), // Los items vendrán incluidos
    enabled: !!quotationId,
    staleTime: 5 * 60 * 1000
  });
};

/**
 * Hook para agregar/actualizar items del presupuesto
 */
export const useUpdateQuotationItems = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ quotationId, items }) => quotationService.updateQuotation(quotationId, { items }),
    onSuccess: (_, { quotationId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATION_ITEMS, quotationId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATION, quotationId] });
      success('Items actualizados correctamente.');
    },
    onError: (err) => {
      console.error('Error al actualizar items:', err);
      error(err.response?.data?.message || 'Error al actualizar los items.');
    }
  });
};

/**
 * Hook para generar PDF del presupuesto
 */
export const useGenerateQuotationPDF = () => {
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: (quotationId) => quotationService.generateQuotationPDF(quotationId),
    onSuccess: (pdfData) => {
      // Descargar el PDF
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `presupuesto-${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      success('PDF generado y descargado correctamente.');
    },
    onError: (err) => {
      console.error('Error al generar PDF:', err);
      error(err.response?.data?.message || 'Error al generar el PDF.');
    }
  });
};

/**
 * Hook para enviar presupuesto por email
 */
export const useSendQuotationEmail = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ quotationId, emailData }) => quotationService.sendQuotationEmail(quotationId, emailData),
    onSuccess: (_, { quotationId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATION, quotationId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTATIONS] });
      success('Presupuesto enviado por email correctamente.');
    },
    onError: (err) => {
      console.error('Error al enviar email:', err);
      error(err.response?.data?.message || 'Error al enviar el presupuesto.');
    }
  });
};

/**
 * Hook para obtener historial de versiones
 */
export const useQuotationVersions = (quotationId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.QUOTATION_VERSIONS, quotationId],
    queryFn: () => quotationService.getQuotationHistory(quotationId),
    enabled: !!quotationId,
    staleTime: 10 * 60 * 1000
  });
};

/**
 * Hook para presupuestos agrupados por estado (Kanban)
 */
export const useQuotationsKanban = (filters = {}) => {
  return useQuery({
    queryKey: ['quotations-kanban', filters],
    queryFn: () => quotationService.getQuotations(filters),
    staleTime: 3 * 60 * 1000,
    select: (data) => {
      const columns = {};
      
      Object.values(QUOTATION_STATUSES).forEach(status => {
        columns[status.id] = {
          ...status,
          quotations: data.quotations?.filter(q => q.status_id === status.id) || []
        };
      });
      
      return {
        columns,
        totalQuotations: data.totalQuotations || 0,
        stats: data.stats || {}
      };
    }
  });
};

/**
 * Hook para cálculo automático de totales
 */
export const useQuotationCalculations = (items = []) => {
  return useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const taxAmount = subtotal * 0.21; // IVA 21%
    const total = subtotal + taxAmount;

    const itemsCount = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      taxAmount,
      total,
      itemsCount,
      totalQuantity,
      formatted: {
        subtotal: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(subtotal),
        taxAmount: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(taxAmount),
        total: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)
      }
    };
  }, [items]);
};

/**
 * Utilidad para validar si un presupuesto puede avanzar al siguiente estado
 */
export const canAdvanceToStatus = (quotation, targetStatusId) => {
  const currentStatus = Object.values(QUOTATION_STATUSES).find(s => s.id === quotation.status_id);
  const targetStatus = Object.values(QUOTATION_STATUSES).find(s => s.id === targetStatusId);
  
  if (!currentStatus || !targetStatus) return false;
  
  // Verificar campos requeridos
  const hasRequiredFields = targetStatus.requiredFields.every(field => {
    if (field === 'items') {
      return quotation.items && quotation.items.length > 0;
    }
    return quotation[field] !== null && quotation[field] !== undefined && quotation[field] !== '';
  });
  
  return hasRequiredFields;
};
