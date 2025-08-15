/**
 * Hook personalizado para el Wizard de Presupuestación
 * 
 * Maneja el estado y las operaciones del wizard multi-paso
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationService, calcularPresupuesto, DEFAULT_INDICES, DEFAULT_TARIFAS, precioBasePorUM, unitsPerTruck } from '@compartido/services';
import { useNotifications } from '@compartido/hooks/useNotifications';

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
        // Mensajes más claros y específicos
        switch(field) {
          case 'project_name':
            errors[field] = 'El nombre del proyecto es requerido';
            break;
          case 'customer_id':
            errors[field] = 'Debe seleccionar un cliente';
            break;
          case 'pieces':
            errors[field] = 'Debe agregar al menos una pieza al presupuesto';
            break;
          case 'payment_terms':
            errors[field] = 'Las condiciones de pago son requeridas';
            break;
          case 'validity_days':
            errors[field] = 'La validez del presupuesto es requerida';
            break;
          default:
            errors[field] = 'Este campo es requerido';
        }
      }
    });

    // Validaciones específicas por etapa
    if (requiredFields.includes('project_name') && formData.project_name) {
      if (formData.project_name.length < 3) {
        errors.project_name = 'El nombre del proyecto debe tener al menos 3 caracteres';
      }
    }

    if (requiredFields.includes('customer_id') && !formData.customer_id) {
      errors.customer_id = 'Debe seleccionar un cliente para continuar';
    }

    if (requiredFields.includes('pieces') && formData.pieces) {
      if (formData.pieces.length === 0) {
        errors.pieces = 'Debe agregar al menos una pieza al presupuesto';
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

  // Función para calcular totales
  const calculateTotals = (formData) => {
    try {
      const piezas = Array.isArray(formData?.pieces) ? formData.pieces : [];

      // Resolver precioPorUM_$ por pieza (BOM+Proceso) si está disponible, sino usar unit_price
      const monthDate = formData.price_date || new Date().toISOString().slice(0,10)
      const zoneId = formData.production_zone_id || formData.zone_id || null

      const items = piezas.map((p) => {
        // Datos técnicos por UM
        const um = p.um || 'UND'
        const pesoTnPorUM = p.pesoPorUM_tn || (um === 'UND' ? (Number(p.weight || 0) / 1000) : 0)
        const tech = {
          um,
          pesoTnPorUM,
          volumenM3PorUM: p.volume_per_um || 0,
          kgAceroPorUM: p.kg_acero_per_um || 0,
        }
        // BOM y precios podrían venir precargados en formData o desde cache
        const bom = Array.isArray(p.bom) ? p.bom : []
        const priceIndex = Array.isArray(formData.material_prices) ? formData.material_prices : []
        const process = formData.process_params || {
          energia_curado_tn: 0, gg_fabrica_tn: 0, gg_empresa_tn: 0, utilidad_tn: 0, ingenieria_tn: 0,
          precio_hora: 0, horas_por_tn_acero: 70, horas_por_m3_hormigon: 25
        }
        const base = bom.length > 0 ? precioBasePorUM(bom, priceIndex, process, tech).total : Number(p.unit_price || 0)
        return {
          descripcion: p.piece_name || p.piece_code || 'Pieza',
          um,
          cantidad: Number(p.quantity || 0),
          precioPorUM_$: base,
          weightKgPorPieza: Number(p.weight || 0),
          categoriaAjuste: (p.categoriaAjuste === 'ESPECIAL' || p.categoriaAjuste === 'GENERAL') ? p.categoriaAjuste : 'GENERAL'
        }
      })

      // Parametrización mínima (se pueden exponer luego en UI)
      const parametros = {
        porcentajeGG: 0.10,
        aforoToneladas: 26,
        habilitaTransporte: !!formData.apply_transport,
        habilitaMontaje: !!formData.apply_mounting,
        distanciaKm: Number(formData.distance_km || formData.distance_from_zone || 0) || 0,
        categoriaLargo: '26m',
        viajesOverride: null,
        diasMontaje: Number(formData.days_mounting || 0) || 0,
        diasGruaAdicional: Number(formData.days_extra_crane || 0) || 0,
        kmTrasladoGrua: Number(formData.km_traslado_grua || 0) || 0,
        usaGruaAdicional: !!formData.use_extra_crane,
      };

      const entrada = {
        fechaPreciosBase: formData.price_date || new Date().toISOString().slice(0,10),
        indices: DEFAULT_INDICES,
        parametros,
        ajustesMateriales: {
          porcentajeComercial: Number(formData.materials_commercial_adj || 0) || 0,
          multiplicadorAdicional: Number(formData.materials_multiplier || 1) || 1,
        },
        tarifas: DEFAULT_TARIFAS,
        tarifarioTransporte: Array.isArray(formData.transport_fares) ? formData.transport_fares : [],
        items,
        trabajosComplementarios: {
          TC1: Array.isArray(formData.tc1) ? formData.tc1 : [],
          TC2: Array.isArray(formData.tc2) ? formData.tc2 : [],
        },
      };

      const res = calcularPresupuesto(entrada);

      // Extender viajes considerando unidades/volumen
      try {
        const truck = formData.truck_type || null
        if (truck) {
          const totalUnidades = piezas.reduce((a, p) => a + Number(p.quantity || 0), 0)
          const piece0 = piezas[0] || {}
          const rules = formData.packing_rules || { orientation: 'flat', min_gap_m: 0.1, max_stack_layers: 3, layer_height_m: piece0.height || 0.5 }
          const pieceGeom = {
            length_m: Number(piece0.length || 0),
            width_m: Number(piece0.width || 0),
            height_m: Number(piece0.height || 0.5),
            weight_tn: Number(piece0.weight || 0) / 1000,
            volume_m3: Number(piece0.volume || ((piece0.length||0)*(piece0.width||0)*(piece0.height||0)))
          }
          const upt = unitsPerTruck(truck, pieceGeom, rules)
          const viajes_unidades = Math.ceil((totalUnidades || 0) / Math.max(1, upt))
          const volumenTruck = (truck.deck_length_m * truck.deck_width_m * truck.max_stack_height_m) * (truck.usable_volume_factor || 1)
          const totalVolumen = piezas.reduce((a, p) => a + Number(p.quantity || 0) * Number(p.volume || 0), 0)
          const viajes_volumen = Math.ceil((totalVolumen || 0) / Math.max(1e-9, volumenTruck))
          const viajes_peso = Math.ceil((res.transporte.pesoTotalTransporte || 0) / (entrada.parametros.aforoToneladas || 26))
          const viajes_final = Math.max(viajes_peso, viajes_unidades, viajes_volumen)
          res.transporte.viajes = viajes_final
          res.transporte.importeTransporteBase = Math.round(viajes_final * res.transporte.tarifaSeleccionada * 100) / 100
          res.transporte.ggTransporte = Math.round(res.transporte.importeTransporteBase * entrada.parametros.porcentajeGG * 100) / 100
          res.transporte.totalTransporte = Math.round((res.transporte.importeTransporteBase + res.transporte.ggTransporte) * 100) / 100
        }
      } catch (_) {}

      // Mantener interfaz de totals existente y añadir totales del motor
      return {
        pieces_subtotal: res.materiales.subtotalMaterialesFinal,
        pieces_weight: res.transporte.pesoTotalTransporte * 1000, // kg para compat
        transport_cost: res.transporte.totalTransporte,
        mounting_cost: res.montaje.totalMontaje,
        engineering_cost: Number(formData.engineering_cost || 0),
        metallic_inserts_cost: Number(formData.metallic_inserts_cost || 0),
        waterproofing_cost: Number(formData.waterproofing_cost || 0),
        subtotal: res.totales.totalGeneralPretensa, // antes de impuestos en UI
        taxes: (res.totales.totalGeneralPretensa) * (Number(formData.tax_rate || 0.21)),
        total: (res.totales.totalGeneralPretensa) * (1 + Number(formData.tax_rate || 0.21)),
        motor: res,
      };
    } catch (e) {
      return {
        pieces_subtotal: 0,
        pieces_weight: 0,
        transport_cost: 0,
        mounting_cost: 0,
        engineering_cost: 0,
        metallic_inserts_cost: 0,
        waterproofing_cost: 0,
        subtotal: 0,
        taxes: 0,
        total: 0,
        error: e?.message || 'Error en motor de cálculo'
      };
    }
  };

  // Función para obtener el estado del kanban basado en la etapa
  const getKanbanStatus = (currentStep, formData) => {
    if (!currentStep) return 'nuevo';
    
    switch (currentStep) {
      case 1:
      case 2:
        return 'en_desarrollo';
      case 3:
      case 4:
        return 'en_cotizacion';
      case 5:
        return 'para_revision';
      case 6:
        return formData.status === 'accepted' ? 'aceptado' : 
               formData.status === 'rejected' ? 'rechazado' : 'enviado';
      default:
        return 'nuevo';
    }
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
