/**
 * Hook personalizado para el Wizard de Presupuestación
 * 
 * Maneja el estado y las operaciones del wizard multi-paso
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '../services';
import { useNotifications } from './useNotifications';
import { calcularPresupuesto, DEFAULT_INDICES, DEFAULT_TARIFAS } from '../services';
import { unitsPerTruck } from '../utils/packing';

export const usePresupuestacionWizard = (id = null) => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  // Query para obtener datos existentes
  const { data, isLoading, isError } = useQuery({
    queryKey: ['presupuestacion-wizard', id],
    queryFn: () => id ? quotationService.getQuotation(id) : null,
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutación para actualizar presupuestación
  const updateMutation = useMutation({
    mutationFn: (data) => {
      if (id) {
        return quotationService.updateQuotation(id, data);
      } else {
        return quotationService.createQuotation(data);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['presupuestacion-wizard']);
      queryClient.invalidateQueries(['quotations']);
      success('Presupuestación actualizada correctamente');
      return result;
    },
    onError: (err) => {
      console.error('Error al actualizar presupuestación:', err);
      error('Error al guardar los cambios');
    },
  });

  // Mutación para guardar como borrador
  const saveDraftMutation = useMutation({
    mutationFn: (data) => {
      const draftData = {
        ...data,
        status: 'draft',
        updated_at: new Date().toISOString()
      };
      
      if (id) {
        return quotationService.updateQuotation(id, draftData);
      } else {
        return quotationService.createQuotation(draftData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['presupuestacion-wizard']);
      queryClient.invalidateQueries(['quotations']);
    },
    onError: (err) => {
      console.error('Error al guardar borrador:', err);
    },
  });

  // Función para validar una etapa
  const validateStep = async (formData, requiredFields = []) => {
    const errors = {};
    
    // Validar campos requeridos
    requiredFields.forEach(field => {
      if (!formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0)) {
        errors[field] = `${field} es requerido`;
      }
    });

    // Validaciones específicas por etapa
    if (requiredFields.includes('project_name') && formData.project_name) {
      if (formData.project_name.length < 3) {
        errors.project_name = 'El nombre del proyecto debe tener al menos 3 caracteres';
      }
    }

    if (requiredFields.includes('customer_id') && !formData.customer_id) {
      errors.customer_id = 'Debe seleccionar un cliente';
    }

    if (requiredFields.includes('pieces') && formData.pieces) {
      if (formData.pieces.length === 0) {
        errors.pieces = 'Debe agregar al menos una pieza';
      } else {
        // Validar que cada pieza tenga cantidad
        formData.pieces.forEach((piece, index) => {
          if (!piece.quantity || piece.quantity <= 0) {
            errors[`pieces_${index}_quantity`] = 'La cantidad debe ser mayor a 0';
          }
        });
      }
    }

    if (requiredFields.includes('payment_terms') && !formData.payment_terms) {
      errors.payment_terms = 'Debe definir las condiciones de pago';
    }

    if (requiredFields.includes('validity_days')) {
      if (!formData.validity_days || formData.validity_days < 1) {
        errors.validity_days = 'Los días de validez deben ser mayor a 0';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Función para calcular totales usando el motor determinista
  const calculateTotals = (formData) => {
    try {
      const fechaPreciosBase = formData?.prices_as_of || new Date().toISOString().slice(0, 10);
      const piezas = Array.isArray(formData?.pieces) ? formData.pieces : [];

      // Mapear piezas del form a items del motor
      const items = piezas.map((p) => ({
        descripcion: p.piece_name || p.piece_code || String(p.piece_id || ''),
        um: (p.um || 'UND'),
        cantidad: Number(p.quantity || 0),
        longitudM: Number(p.length || 0) || undefined,
        anchoM: Number(p.width || 0) || undefined,
        pesoPorUM_tn: Number(p.pesoPorUM_tn || 0) || undefined,
        weightKgPorPieza: Number(p.weight || 0) || undefined,
        precioPorUM_$: Number(p.unit_price || 0),
        categoriaAjuste: (p.categoriaAjuste === 'ESPECIAL') ? 'ESPECIAL' : 'GENERAL',
      }));

      // Calcular viajesOverride con unitsPerTruck si hay datos de camión/packing
      let viajesOverride = null;
      try {
        const truck = formData?.truck_type;
        const packing = formData?.packing_rules;
        if (truck && packing && piezas.length > 0) {
          // Asumir primer tipo de pieza como representativa para unidades por camión (v1)
          const any = piezas[0] || {};
          const pieceGeom = {
            length_m: Number(any.length || 0),
            width_m: Number(any.width || 0),
            height_m: Number(any.thickness || 0),
            weight_tn: Number(any.pesoPorUM_tn || 0) || (Number(any.weight || 0) / 1000) || 0,
            volume_m3: (Number(any.length || 0) * Number(any.width || 0) * Number(any.thickness || 0)) || 0,
          };
          const upt = unitsPerTruck(truck, pieceGeom, packing);
          const totalUnits = piezas.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
          const totalWeightTn = piezas.reduce((acc, p) => acc + ((Number(p.pesoPorUM_tn || 0) > 0)
            ? Number(p.pesoPorUM_tn || 0) * Number(p.quantity || 0)
            : (Number(p.weight || 0) / 1000) * Number(p.quantity || 0)
          ), 0);
          const vPeso = Math.ceil(totalWeightTn / (Number(formData?.aforoToneladas || 26)));
          const vUnidades = upt > 0 ? Math.ceil(totalUnits / upt) : 0;
          const vVolumen = 0; // v1: volumen global opcional si se define
          viajesOverride = Math.max(vPeso || 0, vUnidades || 0, vVolumen || 0) || null;
        }
      } catch (_) {}

      // Parámetros del motor
      const categoriaLargo = (() => {
        const maxLen = Math.max(0, ...piezas.map(p => Number(p.length || 0)));
        if (maxLen <= 13.5) return '13_5m';
        if (maxLen <= 16) return '16m';
        if (maxLen <= 26) return '26m';
        if (maxLen <= 30) return '30m';
        return '>30m';
      })();

      const habilitaTransporte = formData?.apply_transport ?? true;
      const habilitaMontaje = formData?.apply_mounting ?? true;
      const parametros = {
        porcentajeGG: Number(formData?.porcentajeGG ?? 0.10),
        aforoToneladas: Number(formData?.aforoToneladas ?? 26),
        habilitaTransporte,
        habilitaMontaje,
        distanciaKm: Number(formData?.distance_km || formData?.distanceKm || 0),
        categoriaLargo,
        viajesOverride,
        diasMontaje: Number(formData?.diasMontaje || 0),
        diasGruaAdicional: Number(formData?.diasGruaAdicional || 0),
        kmTrasladoGrua: Number(formData?.kmTrasladoGrua || 0),
        usaGruaAdicional: Boolean(formData?.usaGruaAdicional || false),
      };

      const ajustesMateriales = {
        porcentajeComercial: Number(formData?.commercial_discount || 0),
        multiplicadorAdicional: Number(formData?.global_multiplier || 1),
      };

      const input = {
        fechaPreciosBase,
        indices: DEFAULT_INDICES,
        parametros,
        ajustesMateriales,
        tarifas: DEFAULT_TARIFAS,
        tarifarioTransporte: Array.isArray(formData?.tarifarioTransporte) ? formData.tarifarioTransporte : [],
        items,
        trabajosComplementarios: { TC1: [], TC2: [] },
      };

      const motor = calcularPresupuesto(input);

      // Extras de UI fuera del motor
      const engineering = Number(formData?.engineering_cost || 0);
      const inserts = Number(formData?.metallic_inserts_cost || 0);
      const waterproof = Number(formData?.waterproofing_cost || 0);
      const otherCosts = Array.isArray(formData?.other_costs) ? formData.other_costs.reduce((a,c)=> a + (Number(c.amount||0)), 0) : 0;
      const extras = engineering + inserts + waterproof + otherCosts;

      const pieces_weight_kg = piezas.reduce((acc, p) => acc + (
        (Number(p.pesoPorUM_tn || 0) > 0)
          ? (Number(p.pesoPorUM_tn) * 1000) * Number(p.quantity || 0)
          : Number(p.weight || 0) * Number(p.quantity || 0)
      ), 0);

      const baseTotal = Number(motor?.totales?.totalGeneralPretensa || 0);
      const subtotal = baseTotal + extras;
      const taxRate = Number(formData?.tax_rate || 0.21);
      const taxes = subtotal * taxRate;
      const total = subtotal + taxes;

      return {
        pieces_subtotal: Number(motor?.materiales?.subtotalMaterialesFinal || 0),
        pieces_weight: pieces_weight_kg,
        transport_cost: Number(motor?.transporte?.totalTransporte || 0),
        mounting_cost: Number(motor?.montaje?.totalMontaje || 0),
        engineering_cost: engineering,
        metallic_inserts_cost: inserts,
        waterproofing_cost: waterproof,
        subtotal,
        taxes,
        total,
        motor,
      };
    } catch (err) {
      console.error('Error en calcularPresupuesto:', err);
      return {
        pieces_subtotal: 0,
        pieces_weight: 0,
        transport_cost: 0,
        mounting_cost: 0,
        engineering_cost: Number(formData?.engineering_cost || 0),
        metallic_inserts_cost: Number(formData?.metallic_inserts_cost || 0),
        waterproofing_cost: Number(formData?.waterproofing_cost || 0),
        subtotal: 0,
        taxes: 0,
        total: 0,
        motor: null,
      };
    }
  };

  // Función para obtener el estado del kanban basado en la etapa
  const getKanbanStatus = (currentStep, formData) => {
    // Unificar con columnas del Kanban: draft, in_review, sent, approved, rejected
    if (!currentStep) return 'draft';

    if (currentStep <= 4) return 'draft';
    if (currentStep === 5) return 'in_review';
    if (currentStep >= 6) {
      if (formData?.status === 'approved' || formData?.status === 'aceptado') return 'approved';
      if (formData?.status === 'rejected' || formData?.status === 'rechazado') return 'rejected';
      return 'sent';
    }
    return 'draft';
  };

  // Función para generar número de presupuesto
  const generateQuotationNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `PRES-${year}${month}-${random}`;
  };

  return {
    // Datos
    data: data?.data || null,
    isLoading,
    isError,
    
    // Mutaciones
    updatePresupuestacion: updateMutation.mutateAsync,
    saveAsDraft: saveDraftMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isSaving: saveDraftMutation.isPending,
    
    // Utilidades
    validateStep,
    calculateTotals,
    getKanbanStatus,
    generateQuotationNumber,

    // Estado de las mutaciones
    updateError: updateMutation.error,
    saveError: saveDraftMutation.error,
  };
};
