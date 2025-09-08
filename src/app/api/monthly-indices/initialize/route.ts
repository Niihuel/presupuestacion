import { NextRequest, NextResponse } from 'next/server';
import { PieceCostCalculatorService } from '@/lib/services/piece-cost-calculator.service';

interface InitializeIndicesRequest {
  month: number;
  year: number;
  dollarRate: number;
  steelIndex?: number;
  laborIndex?: number;
  concreteIndex?: number;
  fuelIndex?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: InitializeIndicesRequest = await req.json();
    
    if (!body.month || !body.year || !body.dollarRate) {
      return NextResponse.json(
        { error: 'month, year y dollarRate son requeridos' },
        { status: 400 }
      );
    }

    if (body.month < 1 || body.month > 12) {
      return NextResponse.json(
        { error: 'month debe estar entre 1 y 12' },
        { status: 400 }
      );
    }

    const costService = new PieceCostCalculatorService();
    
    await costService.createBaseMonthlyIndices(
      body.month,
      body.year,
      body.dollarRate,
      body.steelIndex || 1.0,
      body.laborIndex || 1.0,
      body.concreteIndex || 1.0,
      body.fuelIndex || 1.0
    );

    return NextResponse.json({
      success: true,
      message: `Índices mensuales inicializados para ${body.month}/${body.year}`,
      data: {
        month: body.month,
        year: body.year,
        dollarRate: body.dollarRate,
        steelIndex: body.steelIndex || 1.0,
        laborIndex: body.laborIndex || 1.0,
        concreteIndex: body.concreteIndex || 1.0,
        fuelIndex: body.fuelIndex || 1.0
      }
    });
  } catch (error) {
    console.error('Error initializing monthly indices:', error);
    return NextResponse.json(
      { 
        error: 'Error al inicializar índices mensuales', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
