import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMargin, requiresMarginApproval } from '@/lib/validations/budget-wizard';

// Ajustes por forma de pago
const PAYMENT_ADJUSTMENTS = {
  CASH: -3,      // 3% descuento
  DAYS_30: 0,    // Precio lista
  DAYS_60: 2,    // 2% recargo
  DAYS_90: 5     // 5% recargo
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      materialsCost,
      freightCost,
      montageCost,
      additionalsCost,
      paymentTerms = 'DAYS_30',
      currency = 'ARS',
      exchangeRate = 1,
      validityDays = 30,
      includesTax = true,
      taxRate = 21,
      suggestedMargin = 25,
      clientId,
      projectId,
      plantId,
      pieces = [],
      distance = {},
      freight = {},
      additionals = {}
    } = body;

    // Calcular subtotal base
    const baseCost = materialsCost + freightCost + montageCost + additionalsCost;

    // Aplicar margen de ganancia
    const marginAmount = baseCost * (suggestedMargin / 100);
    const subtotalWithMargin = baseCost + marginAmount;

    // Aplicar ajuste por forma de pago
    const paymentAdjustment = PAYMENT_ADJUSTMENTS[paymentTerms as keyof typeof PAYMENT_ADJUSTMENTS] || 0;
    const paymentAdjustmentAmount = subtotalWithMargin * (paymentAdjustment / 100);
    const subtotal = subtotalWithMargin + paymentAdjustmentAmount;

    // Calcular IVA
    const tax = includesTax ? subtotal * (taxRate / 100) : 0;
    const finalTotal = subtotal + tax;

    // Convertir a moneda si es necesario
    const finalTotalInCurrency = currency === 'USD' ? finalTotal / exchangeRate : finalTotal;

    // Verificar margen y alertas
    const actualMargin = calculateMargin(baseCost, subtotalWithMargin);
    const marginApproval = requiresMarginApproval(actualMargin);

    // Buscar presupuestos similares para comparación
    const similarBudgets = await prisma.budget.findMany({
      where: {
        customerId: clientId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Últimos 90 días
        },
        status: { not: 'DRAFT' }
      },
      select: {
        id: true,
        finalTotal: true,
        createdAt: true,
        project: {
          select: { name: true }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Calcular estadísticas de comparación
    let priceComparison = null;
    if (similarBudgets.length > 0) {
      const avgPrice = similarBudgets.reduce((sum, b) => sum + (b.finalTotal || 0), 0) / similarBudgets.length;
      const priceDifference = ((finalTotal - avgPrice) / avgPrice) * 100;
      
      priceComparison = {
        averagePrice: avgPrice,
        difference: priceDifference,
        alert: Math.abs(priceDifference) > 20 ? 
          priceDifference > 0 ? 'price_high' : 'price_low' : null
      };
    }

    // Generar resumen ejecutivo
    const executiveSummary = {
      totalPieces: pieces.reduce((sum: number, p: any) => sum + p.quantity, 0),
      totalWeight: freight.totalRealWeight || 0,
      totalTrucks: freight.trucksRequired || 0,
      deliveryDistance: distance.billedDistance || 0,
      montageDays: additionals.estimatedDays || 0,
      complexity: additionals.complexity || 'medium'
    };

    // Calcular fecha de vencimiento
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Alertas y validaciones
    const alerts = [];
    
    if (marginApproval.required) {
      alerts.push({
        type: marginApproval.level,
        message: `Margen de ${actualMargin.toFixed(1)}% requiere aprobación`,
        requiresApproval: true
      });
    }

    if (priceComparison?.alert) {
      alerts.push({
        type: 'info',
        message: priceComparison.alert === 'price_high' ?
          `Precio ${priceComparison.difference.toFixed(1)}% mayor al promedio histórico` :
          `Precio ${Math.abs(priceComparison.difference).toFixed(1)}% menor al promedio histórico`
      });
    }

    if (freight.totalFalseWeight > 0) {
      alerts.push({
        type: 'info',
        message: `Se incluyen ${freight.totalFalseWeight.toFixed(2)} toneladas falsas en el flete`
      });
    }

    if (validityDays === 15) {
      alerts.push({
        type: 'warning',
        message: 'Validez corta de 15 días. Cliente debe decidir rápido.'
      });
    }

    // Desglose detallado de costos
    const costBreakdown = {
      materials: {
        base: materialsCost,
        percentage: (materialsCost / baseCost) * 100
      },
      freight: {
        base: freightCost,
        falseTons: freight.totalFalseWeight || 0,
        percentage: (freightCost / baseCost) * 100
      },
      montage: {
        base: montageCost,
        days: additionals.estimatedDays || 0,
        percentage: (montageCost / baseCost) * 100
      },
      additionals: {
        base: additionalsCost,
        percentage: (additionalsCost / baseCost) * 100
      }
    };

    return NextResponse.json({
      summary: {
        baseCost,
        margin: actualMargin,
        marginAmount,
        subtotalWithMargin,
        paymentTerms,
        paymentAdjustment,
        paymentAdjustmentAmount,
        subtotal,
        tax,
        finalTotal,
        finalTotalInCurrency,
        currency,
        exchangeRate,
        validityDays,
        expiresAt
      },
      executiveSummary,
      costBreakdown,
      priceComparison,
      marginApproval,
      alerts,
      similarBudgets,
      metadata: {
        generatedAt: new Date(),
        version: '1.0',
        requiresApproval: marginApproval.required
      }
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Error al generar resumen' },
      { status: 500 }
    );
  }
}

// GET para obtener presupuesto guardado
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resumeToken = searchParams.get('resumeToken');
    const budgetId = searchParams.get('id');

    let budget;
    
    if (resumeToken) {
      budget = await prisma.budget.findFirst({
        where: { resumeToken },
        include: {
          items: {
            include: { piece: true }
          },
          additionals: true,
          project: {
            include: { customer: true }
          }
        }
      });
    } else if (budgetId) {
      budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: {
          items: {
            include: { piece: true }
          },
          additionals: true,
          project: {
            include: { customer: true }
          }
        }
      });
    }

    if (!budget) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    // Parsear datos del borrador si existe
    let draftData = null;
    if (budget.draftData) {
      try {
        draftData = JSON.parse(budget.draftData);
      } catch (e) {
        console.error('Error parsing draft data:', e);
      }
    }

    return NextResponse.json({
      budget,
      draftData,
      canEdit: budget.status === 'pending' || budget.isDraft
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { error: 'Error al obtener presupuesto' },
      { status: 500 }
    );
  }
}
