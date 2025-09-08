import { prisma } from '@/lib/prisma';

export interface MaterialCost {
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
}

export interface PieceCostBreakdown {
  materialsCost: number;
  energyCost: number;
  laborCost: number;
  overheadCost: number;
  totalBaseCost: number;
  adjustedCost: number;
  finalPrice: number;
}

/**
 * Service for calculating piece costs based on the three-layer pricing logic
 */
export class CostCalculationService {
  /**
   * Layer 1: Calculate base material cost with BOM formula
   */
  async calculateMaterialCost(pieceId: string, quantity: number = 1): Promise<MaterialCost[]> {
    // Get piece materials (BOM)
    const pieceMaterials = await prisma.pieceMaterial.findMany({
      where: { pieceId },
      include: { material: true }
    });

    const costs: MaterialCost[] = [];
    
    for (const pm of pieceMaterials) {
      const materialQuantity = pm.quantity * quantity;
      const scrapMultiplier = 1 + (pm.scrapPercent / 100);
      const totalQuantity = materialQuantity * scrapMultiplier;
      
      costs.push({
        materialId: pm.materialId,
        quantity: totalQuantity,
        unitPrice: pm.material.currentPrice,
        totalCost: totalQuantity * pm.material.currentPrice
      });
    }
    
    return costs;
  }

  /**
   * Layer 1: Add general cost parameters
   */
  async addGeneralCosts(pieceId: string, materialsCost: number): Promise<PieceCostBreakdown> {
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId }
    });
    
    if (!piece) throw new Error('Piece not found');
    
    // Get active cost parameters
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
    
    // Convert to map for easy access
    const params = new Map<string, any>(costParams.map((p: any) => [p.name, p]));
    
    // Calculate costs based on piece weight (in tons)
    const weightInTons = (piece.weight || 0) / 1000;
    const volumeInM3 = piece.volume || 0;
    
    // Energy and curing ($/tn)
    const energyCost = weightInTons * ((params.get('ENERGIA_Y_CURADO') as any)?.value || 15658);
    
    // General factory expenses ($/tn)
    const factoryOverhead = weightInTons * ((params.get('GASTOS_GRALES_FABRICA') as any)?.value || 45183);
    
    // General company expenses ($/tn)
    const companyOverhead = weightInTons * ((params.get('GASTOS_GRALES_EMPRESA') as any)?.value || 41000);
    
    // Utility ($/tn)
    const utility = weightInTons * ((params.get('UTILIDAD') as any)?.value || 34693);
    
    // Labor cost for filling ($/m³)
    const fillingLabor = volumeInM3 * ((params.get('MANO_OBRA_LLENADO') as any)?.value || 188850);
    
    // Calculate steel weight for labor calculation
    const steelMaterials = await prisma.pieceMaterial.findMany({
      where: {
        pieceId,
        material: { category: 'acero' }
      },
      include: { material: true }
    });
    
    const steelWeight = steelMaterials.reduce((sum: number, sm: any) => sum + sm.quantity, 0) / 1000; // to tons
    const steelLabor = steelWeight * 70 * ((params.get('HORA_MANO_OBRA') as any)?.value || 3000); // 70 hs/tn
    
    const totalBaseCost = materialsCost + energyCost + factoryOverhead + companyOverhead + utility + fillingLabor + steelLabor;
    
    return {
      materialsCost,
      energyCost,
      laborCost: fillingLabor + steelLabor,
      overheadCost: factoryOverhead + companyOverhead + utility,
      totalBaseCost,
      adjustedCost: totalBaseCost, // Will be updated in Layer 2
      finalPrice: totalBaseCost // Will be updated in Layer 2
    };
  }

  /**
   * Layer 2: Apply adjustment scale
   */
  async applyAdjustmentScale(baseCost: number, pieceFamily?: string): Promise<number> {
    // Get active adjustment scale
    const scale = await prisma.adjustmentScale.findFirst({
      where: { isActive: true }
    });
    
    if (!scale) {
      console.warn('No active adjustment scale found, using base cost');
      return baseCost;
    }
    
    // Apply general discount
    let adjustedCost = baseCost * (1 + scale.generalDiscount / 100);
    
    // Apply general adjustment
    adjustedCost = adjustedCost * (1 + scale.generalAdjustment / 100);
    
    // Check if piece family qualifies for special adjustment
    const specialCategories = scale.specialCategories || ['TT', 'PLACAS_PLANAS'];
    if (pieceFamily && specialCategories.includes(pieceFamily) && scale.specialAdjustment) {
      adjustedCost = adjustedCost * (1 + scale.specialAdjustment / 100);
    }
    
    return adjustedCost;
  }

  /**
   * Layer 3: Apply polynomial formula for date adjustment
   */
  async applyPolynomialFormula(
    originalPrice: number,
    baseMonth: number,
    baseYear: number,
    targetMonth: number,
    targetYear: number
  ): Promise<number> {
    try {
      // Get monthly indices for both periods
      const [currentIndices, baseIndices] = await Promise.all([
        prisma.monthlyIndex.findUnique({
          where: { month_year: { month: targetMonth, year: targetYear } }
        }),
        prisma.monthlyIndex.findUnique({
          where: { month_year: { month: baseMonth, year: baseYear } }
        })
      ]);

      if (!currentIndices || !baseIndices) {
        console.log('Monthly indices not found, returning original price');
        return originalPrice;
      }

      // Apply PRETENSA polynomial formula with correct coefficients:
      // P = P₀ * (0.4*(Ac'/Ac₀) + 0.3*(M'/M₀) + 0.2*(H'/H₀) + 0.1*(G'/G₀))
      const steelFactor = 0.4 * (currentIndices.steelIndex / baseIndices.steelIndex);
      const laborFactor = 0.3 * (currentIndices.laborIndex / baseIndices.laborIndex);
      const concreteFactor = 0.2 * (currentIndices.concreteIndex / baseIndices.concreteIndex);
      const fuelFactor = 0.1 * (currentIndices.fuelIndex / baseIndices.fuelIndex);

      const totalFactor = steelFactor + laborFactor + concreteFactor + fuelFactor;
      
      return originalPrice * totalFactor;
    } catch (error) {
      console.error('Error applying polynomial formula:', error);
      return originalPrice;
    }
  }

  /**
   * Calculate freight cost with "false tons" logic
   */
  async calculateFreightCost(
    pieces: Array<{ id: string; weight: number; length: number }>,
    origin: string,
    distance: number
  ): Promise<{
    realWeight: number;
    falseWeight: number;
    trucks: number;
    costPerTruck: number;
    totalCost: number;
  }> {
    // Get freight rates
    const freightRate = await prisma.freightRate.findFirst({
      where: {
        origin,
        kmFrom: { lte: distance },
        kmTo: { gte: distance },
        isActive: true
      }
    });
    
    if (!freightRate) {
      throw new Error(`No freight rate found for origin ${origin} and distance ${distance}km`);
    }
    
    // Determine if any piece is over 12m
    const hasLongPieces = pieces.some(p => p.length > 12);
    const rate = hasLongPieces ? freightRate.rateOver12m : freightRate.rateUnder12m;
    
    // Calculate total real weight
    const realWeight = pieces.reduce((sum, p) => sum + p.weight, 0) / 1000; // to tons
    
    // Calculate number of trucks needed
    const minCapacity = freightRate.minCapacity || 24; // Default 24 tons
    const trucks = Math.ceil(realWeight / minCapacity);
    
    // Calculate false weight (to fill minimum capacity)
    const totalCapacity = trucks * minCapacity;
    const falseWeight = Math.max(0, totalCapacity - realWeight);
    
    // Calculate cost
    const costPerTruck = rate * distance;
    const totalCost = costPerTruck * trucks;
    
    return {
      realWeight,
      falseWeight,
      trucks,
      costPerTruck,
      totalCost
    };
  }

  /**
   * Update steel index based on dollar exchange rate variation
   */
  async updateSteelIndexFromDollar(
    month: number,
    year: number,
    newDollarRate: number
  ): Promise<void> {
    // Get previous month's data
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const prevIndices = await prisma.monthlyIndex.findUnique({
      where: { month_year: { month: prevMonth, year: prevYear } }
    });
    
    if (!prevIndices) {
      throw new Error('Previous month indices not found');
    }
    
    // Calculate steel index variation based on dollar variation
    const dollarVariation = newDollarRate / prevIndices.dollarRate;
    const newSteelIndex = prevIndices.steelIndex * dollarVariation;
    
    // Update or create monthly index
    await prisma.monthlyIndex.upsert({
      where: { month_year: { month, year } },
      update: {
        steelIndex: newSteelIndex,
        dollarRate: newDollarRate
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
   * Complete piece base cost calculation (Layer 1 combined)
   */
  async calculatePieceBaseCost(pieceId: string, quantity: number = 1): Promise<PieceCostBreakdown> {
    const materialCosts = await this.calculateMaterialCost(pieceId, quantity);
    const totalMaterialCost = materialCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
    
    return await this.addGeneralCosts(pieceId, totalMaterialCost);
  }

  /**
   * Complete cost calculation with all layers
   */
  async calculateTotalCost(params: {
    pieceId: string;
    quantity: number;
    budgetDate?: Date;
  }): Promise<number> {
    const { pieceId, quantity, budgetDate = new Date() } = params;
    
    // Layer 1: Base cost
    const baseCostBreakdown = await this.calculatePieceBaseCost(pieceId, quantity);
    
    // Get piece family for special adjustments
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      include: { family: true }
    });
    
    // Layer 2: Adjustment scale
    const adjustedCost = await this.applyAdjustmentScale(
      baseCostBreakdown.totalBaseCost,
      piece?.family?.code
    );
    
    // Layer 3: Polynomial formula (if different from base month)
    const currentMonth = budgetDate.getMonth() + 1;
    const currentYear = budgetDate.getFullYear();
    
    // Use current month as base for now - in practice this would be the original quote month
    const finalCost = await this.applyPolynomialFormula(
      adjustedCost,
      currentMonth,
      currentYear,
      currentMonth,
      currentYear
    );
    
    return finalCost;
  }

  /**
   * Calculate assembly cost based on distance, tonnage, and specific days
   */
  async calculateAssemblyCost(params: {
    distanceKm: number;
    totalTons: number;
    assemblyDays?: number;
    craneDays?: number;
  }): Promise<{
    baseCost: number;
    assemblyDaysCost: number;
    craneDaysCost: number;
    totalCost: number;
    breakdown: any;
  }> {
    const { distanceKm, totalTons, assemblyDays = 0, craneDays = 0 } = params;
    
    // Get assembly rate based on distance and tonnage
    const rate = await prisma.assemblyRate.findFirst({
      where: { 
        kmFrom: { lte: distanceKm }, 
        kmTo: { gte: distanceKm } 
      },
    });
    
    let baseCost = 0;
    if (rate) {
      if (totalTons < 100) baseCost = rate.rateUnder100t;
      else if (totalTons <= 300) baseCost = rate.rate100_300t;
      else baseCost = rate.rateOver300t;
    }
    
    // Calculate additional costs for assembly and crane days
    const assemblyDaysCost = assemblyDays * 45000; // Base daily assembly rate
    const craneDaysCost = craneDays * 60000; // Base daily crane rate
    
    const totalCost = baseCost + assemblyDaysCost + craneDaysCost;
    
    return {
      baseCost,
      assemblyDaysCost,
      craneDaysCost,
      totalCost,
      breakdown: {
        base: baseCost,
        assemblyDays,
        assemblyDaysCost,
        craneDays,
        craneDaysCost
      }
    };
  }

  /**
   * Get assembly rates from cost parameters
   */
  async getAssemblyRates(): Promise<{
    assemblyDailyRate: number;
    craneDailyRate: number;
  }> {
    const costParams = await prisma.costParameter.findMany({
      where: {
        isActive: true,
        category: 'ASSEMBLY',
        effectiveDate: { lte: new Date() },
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } }
        ]
      }
    });
    
    const params = new Map(costParams.map(p => [p.name, p.value]));
    
    return {
      assemblyDailyRate: params.get('ASSEMBLY_DAILY_RATE') || 45000,
      craneDailyRate: params.get('CRANE_DAILY_RATE') || 60000
    };
  }
}
