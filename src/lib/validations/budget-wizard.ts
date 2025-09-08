import { z } from 'zod';

// Coordenadas de plantas
export const PLANT_COORDINATES = {
  cordoba: {
    lat: -31.4201,
    lng: -64.1888,
    address: 'Av. Circunvalación km 5, Córdoba'
  },
  buenosaires: {
    lat: -34.6037,
    lng: -58.3816,
    address: 'Ruta 9 km 45, Buenos Aires'
  }
};

// Tarifas de flete por distancia
export const FREIGHT_RATES = [
  { kmFrom: 0, kmTo: 50, under12m: 850, over12m: 950 },
  { kmFrom: 51, kmTo: 100, under12m: 900, over12m: 1000 },
  { kmFrom: 101, kmTo: 200, under12m: 950, over12m: 1050 },
  { kmFrom: 201, kmTo: 300, under12m: 1000, over12m: 1100 },
  { kmFrom: 301, kmTo: 500, under12m: 1050, over12m: 1150 },
  { kmFrom: 501, kmTo: 9999, under12m: 1100, over12m: 1200 }
];

// Capacidades de camión
export const TRUCK_CAPACITY = {
  standard: { max: 25, min: 21 },    // ≤12m
  medium: { max: 27, min: 24 },      // >12m and ≤21.5m
  extended: { max: 36.6, min: 26 }   // >21.5m and ≤30m
};

// Para compatibilidad con código existente
export const LEGACY_TRUCK_CAPACITY = {
  under12m: { max: 25, min: 21 },
  over12m: { max: 27, min: 24 }
};

// PASO 3: Cálculo de Distancias
export const distanceStepSchema = z.object({
  constructionLat: z.number().min(-90).max(90),
  constructionLng: z.number().min(-180).max(180),
  constructionAddress: z.string().min(1, 'Dirección requerida'),
  realDistance: z.number().positive('Distancia debe ser positiva'),
  billedDistance: z.number().positive('Distancia facturada debe ser positiva'),
  routePolyline: z.string().optional(),
  hasRestrictions: z.boolean().default(false),
  restrictions: z.string().optional()
});

// PASO 4: Cálculo de Flete
export const freightTruckSchema = z.object({
  truckNumber: z.number().min(1),
  pieces: z.array(z.object({
    id: z.string(),
    name: z.string(),
    weight: z.number(),
    length: z.number(),
    quantity: z.number()
  })),
  realWeight: z.number(),
  falseWeight: z.number().default(0),
  maxCapacity: z.number(),
  pieceCount: z.number(),
  over12m: z.boolean(),
  truckType: z.enum(['standard', 'medium', 'extended']).default('standard'),
  requiresEscort: z.boolean().default(false),
  cost: z.number()
});

export const freightStepSchema = z.object({
  trucks: z.array(freightTruckSchema),
  totalRealWeight: z.number(),
  totalFalseWeight: z.number(),
  totalFreightCost: z.number(),
  optimizationMethod: z.enum(['binpacking', 'firstfit', 'manual']).default('binpacking')
});

// PASO 5: Adicionales y Montaje
export const montageServiceSchema = z.object({
  crane: z.object({
    enabled: z.boolean(),
    tonnageCategory: z.enum(['under100', '100to300', 'over300']).optional(),
    days: z.number().min(1).optional(),
    mobilizationKm: z.number().optional(),
    cost: z.number().optional()
  }),
  crew: z.object({
    enabled: z.boolean(),
    size: z.number().min(4).max(10).default(4),
    days: z.number().min(1).optional(),
    cost: z.number().optional()
  }),
  supervisor: z.object({
    enabled: z.boolean(),
    days: z.number().min(1).optional(),
    cost: z.number().optional()
  })
});

export const additionalWorkSchema = z.object({
  waterproofing: z.object({
    enabled: z.boolean(),
    area: z.number().optional(),
    type: z.enum(['standard', 'premium']).optional(),
    cost: z.number().optional()
  }),
  neoprenes: z.object({
    enabled: z.boolean(),
    quantity: z.number().optional(),
    unitPrice: z.number().optional(),
    cost: z.number().optional()
  }),
  specialWelding: z.object({
    enabled: z.boolean(),
    meters: z.number().optional(),
    cost: z.number().optional()
  }),
  jointFilling: z.object({
    enabled: z.boolean(),
    meters: z.number().optional(),
    cost: z.number().optional()
  }),
  fireproofPaint: z.object({
    enabled: z.boolean(),
    area: z.number().optional(),
    cost: z.number().optional()
  })
});

export const specialEquipmentSchema = z.object({
  scaffolding: z.object({
    enabled: z.boolean(),
    days: z.number().optional(),
    cost: z.number().optional()
  }),
  liftingEquipment: z.object({
    enabled: z.boolean(),
    type: z.string().optional(),
    cost: z.number().optional()
  }),
  generators: z.object({
    enabled: z.boolean(),
    quantity: z.number().optional(),
    days: z.number().optional(),
    cost: z.number().optional()
  })
});

export const additionalsStepSchema = z.object({
  montageServices: montageServiceSchema,
  additionalWork: additionalWorkSchema,
  specialEquipment: specialEquipmentSchema,
  estimatedDays: z.number().min(1),
  complexity: z.enum(['simple', 'medium', 'complex']),
  totalMontageCost: z.number(),
  totalAdditionalsCost: z.number()
});

// PASO 6: Resumen y Condiciones
export const paymentTermsSchema = z.enum(['CASH', 'DAYS_30', 'DAYS_60', 'DAYS_90']);

export const summaryStepSchema = z.object({
  paymentTerms: paymentTermsSchema,
  paymentDiscount: z.number().default(0), // -3% para contado
  paymentSurcharge: z.number().default(0), // +2% o +5% para plazos
  currency: z.enum(['ARS', 'USD']).default('ARS'),
  exchangeRate: z.number().positive().default(1),
  validityDays: z.enum(['15', '30', '45']).default('30'),
  includesTax: z.boolean().default(true),
  taxRate: z.number().default(21),
  
  // Costos calculados
  materialsCost: z.number(),
  freightCost: z.number(),
  montageCost: z.number(),
  additionalsCost: z.number(),
  subtotal: z.number(),
  margin: z.number().min(0).max(100),
  marginAmount: z.number(),
  total: z.number(),
  tax: z.number(),
  finalTotal: z.number(),
  
  // Notas
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
  
  // Aprobaciones
  requiresApproval: z.boolean().default(false),
  approvalReason: z.string().optional()
});

// Schema completo del wizard
export const budgetWizardSchema = z.object({
  // Pasos 1 y 2 (ya existentes)
  clientId: z.string(),
  projectId: z.string(),
  plantId: z.string(),
  pieces: z.array(z.object({
    pieceId: z.string(),
    quantity: z.number().min(1)
  })),
  
  // Nuevos pasos
  distance: distanceStepSchema.optional(),
  freight: freightStepSchema.optional(),
  additionals: additionalsStepSchema.optional(),
  summary: summaryStepSchema.optional(),
  
  // Metadata
  currentStep: z.number().min(1).max(6),
  completedSteps: z.array(z.number()),
  isDraft: z.boolean().default(true),
  resumeToken: z.string().optional(),
  lastSavedAt: z.date().optional()
});

// Tipos TypeScript
export type DistanceStep = z.infer<typeof distanceStepSchema>;
export type FreightTruck = z.infer<typeof freightTruckSchema>;
export type FreightStep = z.infer<typeof freightStepSchema>;
export type AdditionalsStep = z.infer<typeof additionalsStepSchema>;
export type SummaryStep = z.infer<typeof summaryStepSchema>;
export type BudgetWizard = z.infer<typeof budgetWizardSchema>;

// Funciones de utilidad

/**
 * Redondea la distancia hacia arriba en intervalos de 50km
 */
export function roundDistance(realDistance: number): number {
  return Math.ceil(realDistance / 50) * 50;
}

/**
 * Obtiene la tarifa de flete según distancia y longitud
 */
export function getFreightRate(distance: number, over12m: boolean): number {
  const rate = FREIGHT_RATES.find(r => distance >= r.kmFrom && distance <= r.kmTo);
  if (!rate) return FREIGHT_RATES[FREIGHT_RATES.length - 1][over12m ? 'over12m' : 'under12m'];
  return over12m ? rate.over12m : rate.under12m;
}

/**
 * Calcula toneladas falsas para un camión
 */
export function calculateFalseTons(realWeight: number, truckType: 'standard' | 'medium' | 'extended' | boolean): number {
  let capacity;
  
  if (typeof truckType === 'boolean') {
    // Compatibilidad con versiones anteriores donde truckType era over12m (boolean)
    capacity = truckType ? LEGACY_TRUCK_CAPACITY.over12m : LEGACY_TRUCK_CAPACITY.under12m;
  } else {
    capacity = TRUCK_CAPACITY[truckType];
  }
  
  if (realWeight < capacity.min) {
    return capacity.min - realWeight;
  }
  return 0;
}

/**
 * Estima días de montaje según cantidad y complejidad
 */
export function estimateMontageDays(
  pieceCount: number,
  complexity: 'simple' | 'medium' | 'complex'
): number {
  const baseRate = {
    simple: 10, // piezas por día
    medium: 6,
    complex: 3
  };
  
  return Math.ceil(pieceCount / baseRate[complexity]);
}

/**
 * Calcula el margen de ganancia
 */
export function calculateMargin(cost: number, price: number): number {
  if (cost === 0) return 0;
  return ((price - cost) / cost) * 100;
}

/**
 * Valida si el margen requiere aprobación
 */
export function requiresMarginApproval(margin: number): {
  required: boolean;
  level: 'ok' | 'warning' | 'danger';
} {
  if (margin < 10) {
    return { required: true, level: 'danger' };
  }
  if (margin < 15) {
    return { required: true, level: 'warning' };
  }
  return { required: false, level: 'ok' };
}
