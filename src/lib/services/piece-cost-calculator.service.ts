import { prisma } from "@/lib/prisma";

// Interfaces para el cálculo de costos según lógica PRETENSA
export interface MaterialCostItem {
  materialId: string;
  materialName: string;
  quantity: number;
  scrapPercent: number;
  totalQuantity: number; // quantity * (1 + scrap/100)
  unitPrice: number;
  totalCost: number;
  unit: string;
}

export interface CostBreakdown {
  // CAPA 1: Costo Base
  materialsCost: MaterialCostItem[];
  generalCosts: {
    energyAndCuring: number; // ENERGIA Y CURADO ($/tn)
    generalFactoryExpenses: number; // GASTOS GRALES FABRICA ($/tn) 
    generalCompanyExpenses: number; // GASTOS GRALES EMPRESA ($/tn)
    utility: number; // UTILIDAD ($/tn)
    fillingLabor: number; // MANO OBRA LLENADO ($/m³)
    steelLabor: number; // Cortado, doblado y atado (70 hs/tn)
    engineering: number; // INGENIERÍA ($/tn)
  };
  baseCost: number;
  
  // CAPA 2: Ajustes
  afterDiscount: number; // baseCost * 0.85
  afterAdjustment: number; // afterDiscount * 4.11365
  specialAdjustment?: number; // -20% para TT y PLACAS_PLANAS
  adjustedCost: number;
  
  // CAPA 3: Fórmula Polinómica
  polynomialFactor: number;
  finalCost: number;
  
  // Totales
  unitCost: number;
  totalCost: number;
  calculatedAt: string;
}

export class PieceCostCalculatorService {
  /**
   * Calcula el costo real de una pieza según la lógica PRETENSA de 3 capas
   */
  async calculateRealCost(
    pieceId: string, 
    quantity: number = 1,
    baseMonth?: number,
    baseYear?: number,
    targetMonth?: number,
    targetYear?: number
  ): Promise<CostBreakdown> {
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      include: { 
        family: true, 
        plant: true,
        materials: {
          include: { material: true }
        }
      },
    });
    
    if (!piece) throw new Error("piece_not_found");
    if (!piece.materials || piece.materials.length === 0) {
      throw new Error("piece_formula_not_found - No materials found for piece");
    }

    // CAPA 1: Calcular costo base usando BOM (Bill of Materials)
    const materialsCost = await this.calculateMaterialsCostFromBOM(piece.materials, quantity);
    const generalCosts = await this.calculateGeneralCosts(piece, quantity);
    const baseCost = materialsCost.reduce((sum, m) => sum + m.totalCost, 0) + 
                     Object.values(generalCosts).reduce((sum, cost) => sum + cost, 0);

    // CAPA 2: Aplicar escala de ajustes
    const afterDiscount = baseCost * 0.85; // Descuento -15%
    const afterAdjustment = afterDiscount * 4.11365; // Ajuste +311.365%
    
    // Aplicar ajuste especial para familias TT y PLACAS_PLANAS
    let adjustedCost = afterAdjustment;
    let specialAdjustment;
    const specialFamilies = ['TT', 'PLACAS_PLANAS'];
    if (piece.family && specialFamilies.includes(piece.family.code)) {
      specialAdjustment = afterAdjustment * -0.20; // -20%
      adjustedCost = afterAdjustment + specialAdjustment;
    }

    // CAPA 3: Aplicar fórmula polinómica
    const currentDate = new Date();
    const currentMonth = targetMonth ?? (currentDate.getMonth() + 1);
    const currentYear = targetYear ?? currentDate.getFullYear();
    const origMonth = baseMonth ?? currentMonth;
    const origYear = baseYear ?? currentYear;
    
    const polynomialResult = await this.applyPolynomialFormula(
      adjustedCost, 
      origMonth, 
      origYear, 
      currentMonth, 
      currentYear
    );

    const unitCost = polynomialResult.finalCost / quantity;
    const totalCost = polynomialResult.finalCost;

    return {
      materialsCost,
      generalCosts,
      baseCost,
      afterDiscount,
      afterAdjustment,
      specialAdjustment,
      adjustedCost,
      polynomialFactor: polynomialResult.factor,
      finalCost: polynomialResult.finalCost,
      unitCost,
      totalCost,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Calcula el costo de materiales basado en la fórmula BOM
   */
  private async calculateMaterialsCostFromBOM(
    materials: any[], 
    quantity: number
  ): Promise<MaterialCostItem[]> {
    const materialsCost: MaterialCostItem[] = [];
    
    for (const materialRel of materials) {
      const totalQuantity = materialRel.quantity * quantity * (1 + materialRel.scrapPercent / 100);
      const totalCost = totalQuantity * materialRel.material.currentPrice;
      
      materialsCost.push({
        materialId: materialRel.materialId,
        materialName: materialRel.material.name,
        quantity: materialRel.quantity * quantity,
        scrapPercent: materialRel.scrapPercent,
        totalQuantity,
        unitPrice: materialRel.material.currentPrice,
        totalCost,
        unit: materialRel.material.unit
      });
    }
    
    return materialsCost;
  }

  /**
   * Calcula costos generales según parámetros PRETENSA
   */
  private async calculateGeneralCosts(piece: any, quantity: number) {
    // Obtener parámetros de costo actuales
    const costParams = await prisma.costParameter.findMany({
      where: {
        isActive: true,
        effectiveDate: { lte: new Date() },
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } }
        ]
      }
    });
    
    const params = new Map(costParams.map(p => [p.name, p.value]));
    
    // Peso en toneladas y volumen en m³
    const weightInTons = (piece.weight || 0) / 1000 * quantity;
    const volumeInM3 = (piece.volume || 0) * quantity;
    
    // Calcular cantidad de acero en la fórmula para mano de obra
    const steelQuantity = await this.getSteelQuantityFromFormulas(piece.id, quantity);
    const steelWeightInTons = steelQuantity / 1000;
    
    return {
      energyAndCuring: weightInTons * (params.get('ENERGIA_Y_CURADO') || 15658),
      generalFactoryExpenses: weightInTons * (params.get('GASTOS_GRALES_FABRICA') || 45183),
      generalCompanyExpenses: weightInTons * (params.get('GASTOS_GRALES_EMPRESA') || 41000),
      utility: weightInTons * (params.get('UTILIDAD') || 34693),
      fillingLabor: volumeInM3 * (params.get('MANO_OBRA_LLENADO') || 188850),
      steelLabor: steelWeightInTons * 70 * (params.get('HORA_MANO_OBRA') || 3000), // 70 hs/tn
      engineering: weightInTons * (params.get('INGENIERIA') || 12969)
    };
  }

  /**
   * Obtiene la cantidad total de acero de las fórmulas de una pieza
   */
  private async getSteelQuantityFromFormulas(pieceId: string, quantity: number): Promise<number> {
    const steelMaterials = await prisma.pieceMaterial.findMany({
      where: {
        pieceId,
        material: { category: 'acero' }
      }
    });
    
    return steelMaterials.reduce((sum: number, materialRel: any) => {
      return sum + (materialRel.quantity * quantity * (1 + materialRel.scrapPercent / 100));
    }, 0);
  }

  /**
   * Aplica la fórmula polinómica PRETENSA:
   * P = P₀ * (0.4*(Ac'/Ac₀) + 0.3*(M'/M₀) + 0.2*(H'/H₀) + 0.1*(G'/G₀))
   */
  private async applyPolynomialFormula(
    originalPrice: number,
    baseMonth: number,
    baseYear: number, 
    targetMonth: number,
    targetYear: number
  ): Promise<{ factor: number; finalCost: number }> {
    try {
      // Obtener índices para ambos períodos
      const [baseIndices, targetIndices] = await Promise.all([
        prisma.monthlyIndex.findUnique({
          where: { month_year: { month: baseMonth, year: baseYear } }
        }),
        prisma.monthlyIndex.findUnique({
          where: { month_year: { month: targetMonth, year: targetYear } }
        })
      ]);

      if (!baseIndices || !targetIndices) {
        console.warn('Índices mensuales no encontrados, usando precio original');
        return { factor: 1, finalCost: originalPrice };
      }

      // Aplicar fórmula polinómica con coeficientes fijos PRETENSA
      const steelFactor = 0.4 * (targetIndices.steelIndex / baseIndices.steelIndex);
      const laborFactor = 0.3 * (targetIndices.laborIndex / baseIndices.laborIndex);
      const concreteFactor = 0.2 * (targetIndices.concreteIndex / baseIndices.concreteIndex);
      const fuelFactor = 0.1 * (targetIndices.fuelIndex / baseIndices.fuelIndex);

      const K = steelFactor + laborFactor + concreteFactor + fuelFactor;
      const finalCost = originalPrice * K;
      
      return { factor: K, finalCost };
    } catch (error) {
      console.error('Error aplicando fórmula polinómica:', error);
      return { factor: 1, finalCost: originalPrice };
    }
  }

  /**
   * Actualiza el índice del acero basado en la variación del dólar
   */
  async updateSteelIndexFromDollar(
    month: number,
    year: number,
    newDollarRate: number
  ): Promise<void> {
    // Obtener mes anterior
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const prevIndices = await prisma.monthlyIndex.findUnique({
      where: { month_year: { month: prevMonth, year: prevYear } }
    });
    
    if (!prevIndices) {
      throw new Error('Índices del mes anterior no encontrados');
    }
    
    // Calcular variación del acero basada en la variación del dólar
    const dollarVariation = newDollarRate / prevIndices.dollarRate;
    const newSteelIndex = prevIndices.steelIndex * dollarVariation;
    
    // Actualizar o crear índice mensual
    await prisma.monthlyIndex.upsert({
      where: { month_year: { month, year } },
      update: {
        steelIndex: newSteelIndex,
        dollarRate: newDollarRate,
        source: 'CALCULATED'
      },
      create: {
        month,
        year,
        steelIndex: newSteelIndex,
        laborIndex: prevIndices.laborIndex,
        concreteIndex: prevIndices.concreteIndex,
        fuelIndex: prevIndices.fuelIndex,
        generalIndex: prevIndices.generalIndex,
        dollarRate: newDollarRate,
        source: 'CALCULATED'
      }
    });
  }

  /**
   * Calcula el margen sugerido basado en la cantidad
   */
  private calculateSuggestedMargin(_piece: any, quantity: number): number {
    if (quantity >= 50) return 0.12;
    if (quantity >= 20) return 0.15;
    return 0.18;
  }

  /**
   * Crea índices mensuales con valores base para inicialización
   */
  async createBaseMonthlyIndices(
    month: number,
    year: number,
    dollarRate: number,
    steelIndex: number = 1.0,
    laborIndex: number = 1.0,
    concreteIndex: number = 1.0,
    fuelIndex: number = 1.0
  ): Promise<void> {
    await prisma.monthlyIndex.create({
      data: {
        month,
        year,
        steelIndex,
        laborIndex,
        concreteIndex,
        fuelIndex,
        dollarRate,
        source: 'MANUAL'
      }
    });
  }
}

/**
 * Servicio de flete con lógica de toneladas falsas
 */
export class FreightService {
  /**
   * Calcula el costo de flete con optimización de camiones y toneladas falsas
   */
  async calculateFreightCost(
    pieces: Array<{ id: string; weight: number; length: number; quantity: number }>,
    origin: string, // 'CO', 'BA', 'VM'
    destinationKm: number
  ): Promise<{
    trucks: Array<{
      truckNumber: number;
      pieces: Array<{ pieceId: string; quantity: number }>;
      realWeight: number;
      falseWeight: number;
      maxCapacity: number;
      over12m: boolean;
      cost: number;
    }>;
    totalRealWeight: number;
    totalFalseWeight: number;
    totalCost: number;
  }> {
    // Obtener tarifas de flete
    const freightRate = await prisma.freightRate.findFirst({
      where: {
        origin,
        kmFrom: { lte: destinationKm },
        kmTo: { gte: destinationKm },
        isActive: true
      }
    });
    
    if (!freightRate) {
      throw new Error(`No se encontró tarifa de flete para origen ${origin} y distancia ${destinationKm}km`);
    }
    
    // Separar piezas por longitud
    const shortPieces = pieces.filter(p => p.length <= 12);
    const longPieces = pieces.filter(p => p.length > 12);
    
    const trucks: any[] = [];
    let truckNumber = 1;
    
    // Optimizar camiones para piezas cortas (≤12m)
    if (shortPieces.length > 0) {
      const shortTrucks = this.optimizeTrucks(
        shortPieces, 
        freightRate.rateUnder12m, 
        21, // mínimo
        25, // máximo
        destinationKm,
        false,
        truckNumber
      );
      trucks.push(...shortTrucks);
      truckNumber += shortTrucks.length;
    }
    
    // Optimizar camiones para piezas largas (>12m)
    if (longPieces.length > 0) {
      const longTrucks = this.optimizeTrucks(
        longPieces,
        freightRate.rateOver12m,
        24, // mínimo
        27, // máximo  
        destinationKm,
        true,
        truckNumber
      );
      trucks.push(...longTrucks);
    }
    
    const totalRealWeight = trucks.reduce((sum, truck) => sum + truck.realWeight, 0);
    const totalFalseWeight = trucks.reduce((sum, truck) => sum + truck.falseWeight, 0);
    const totalCost = trucks.reduce((sum, truck) => sum + truck.cost, 0);
    
    return {
      trucks,
      totalRealWeight,
      totalFalseWeight,
      totalCost
    };
  }
  
  /**
   * Optimiza la carga de camiones aplicando lógica de toneladas falsas
   */
  private optimizeTrucks(
    pieces: Array<{ id: string; weight: number; quantity: number }>,
    rate: number,
    minCapacity: number,
    maxCapacity: number,
    distanceKm: number,
    over12m: boolean,
    startTruckNumber: number
  ): Array<any> {
    const trucks: any[] = [];
    let remainingPieces = [...pieces];
    let truckNumber = startTruckNumber;
    
    while (remainingPieces.length > 0) {
      let currentWeight = 0;
      const truckPieces: any[] = [];
      
      // Llenar camión hasta capacidad máxima
      for (let i = remainingPieces.length - 1; i >= 0; i--) {
        const piece = remainingPieces[i];
        const pieceWeight = (piece.weight * piece.quantity) / 1000; // a toneladas
        
        if (currentWeight + pieceWeight <= maxCapacity) {
          currentWeight += pieceWeight;
          truckPieces.push({
            pieceId: piece.id,
            quantity: piece.quantity
          });
          remainingPieces.splice(i, 1);
        }
      }
      
      // Aplicar lógica de toneladas falsas
      const realWeight = currentWeight;
      const falseWeight = Math.max(0, minCapacity - realWeight);
      const billingWeight = Math.max(realWeight, minCapacity);
      
      const cost = rate * distanceKm * billingWeight;
      
      trucks.push({
        truckNumber: truckNumber++,
        pieces: truckPieces,
        realWeight,
        falseWeight,
        maxCapacity,
        over12m,
        cost
      });
    }
    
    return trucks;
  }
}
