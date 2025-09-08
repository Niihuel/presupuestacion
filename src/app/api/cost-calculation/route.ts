import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PieceCostCalculatorService, FreightService } from '@/lib/services/piece-cost-calculator.service';

interface CostCalculationRequest {
  pieceId: string;
  quantity: number;
  transportKm?: number;
  budgetDate?: string;
  // Optional: allow specifying base/target month-year for polynomial adjustment
  baseMonth?: number;
  baseYear?: number;
  targetMonth?: number;
  targetYear?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: CostCalculationRequest = await req.json();
    
    if (!body.pieceId || !body.quantity) {
      return NextResponse.json(
        { error: 'pieceId y quantity son requeridos' },
        { status: 400 }
      );
    }

    const costService = new PieceCostCalculatorService();
    const freightService = new FreightService();
    const budgetDate = body.budgetDate ? new Date(body.budgetDate) : new Date();

    // Calculate piece cost using the new 3-layer PRETENSA logic
    const baseMonth = body.baseMonth ?? (budgetDate.getMonth() + 1);
    const baseYear = body.baseYear ?? budgetDate.getFullYear();
    const targetMonth = body.targetMonth ?? (budgetDate.getMonth() + 1);
    const targetYear = body.targetYear ?? budgetDate.getFullYear();

    const costBreakdown = await costService.calculateRealCost(
      body.pieceId,
      body.quantity,
      baseMonth,
      baseYear,
      targetMonth,
      targetYear
    );

    // Calculate freight cost if transport distance provided
    let freightResult = null;
    if (body.transportKm) {
      const piece = await prisma.piece.findUnique({
        where: { id: body.pieceId }
      });
      
      if (piece) {
        try {
          freightResult = await freightService.calculateFreightCost(
            [{
              id: body.pieceId,
              weight: piece.weight || 0,
              length: piece.length || 0,
              quantity: body.quantity
            }],
            'CO', // Default origin (Córdoba)
            body.transportKm
          );
        } catch (freightError) {
          console.warn('Freight calculation failed:', freightError);
          freightResult = {
            trucks: [],
            totalRealWeight: 0,
            totalFalseWeight: 0,
            totalCost: 0
          };
        }
      }
    }

    const freightCost = freightResult?.totalCost || 0;
    const grandTotal = costBreakdown.totalCost + freightCost;

    const result = {
      pieceId: body.pieceId,
      quantity: body.quantity,
      
      // CAPA 1: Costos base
      materialsCost: costBreakdown.materialsCost,
      generalCosts: costBreakdown.generalCosts,
      baseCost: costBreakdown.baseCost,
      
      // CAPA 2: Ajustes
      afterDiscount: costBreakdown.afterDiscount,
      afterAdjustment: costBreakdown.afterAdjustment,
      specialAdjustment: costBreakdown.specialAdjustment,
      adjustedCost: costBreakdown.adjustedCost,
      
      // CAPA 3: Fórmula polinómica
      polynomialFactor: costBreakdown.polynomialFactor,
      finalCost: costBreakdown.finalCost,
      
      // Totales
      unitCost: costBreakdown.unitCost,
      totalCost: costBreakdown.totalCost,
      freightCost: freightCost,
      freightDetails: freightResult,
      grandTotal: grandTotal,
      
      calculatedAt: costBreakdown.calculatedAt,
      
      // Resumen para compatibilidad
      summary: {
        unitPrice: grandTotal / body.quantity,
        totalPrice: grandTotal,
        breakdown: {
          materials: costBreakdown.baseCost,
          adjustments: costBreakdown.adjustedCost - costBreakdown.baseCost,
          polynomial: costBreakdown.finalCost - costBreakdown.adjustedCost,
          freight: freightCost
        }
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating cost:', error);
    return NextResponse.json(
      { error: 'Error al calcular costos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

