import { NextRequest, NextResponse } from 'next/server';
import { PieceCostCalculatorService } from '@/lib/services/piece-cost-calculator.service';

interface UpdateSteelIndexRequest {
  month: number;
  year: number;
  newDollarRate: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: UpdateSteelIndexRequest = await req.json();
    
    if (!body.month || !body.year || !body.newDollarRate) {
      return NextResponse.json(
        { error: 'month, year y newDollarRate son requeridos' },
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
    
    await costService.updateSteelIndexFromDollar(
      body.month,
      body.year,
      body.newDollarRate
    );

    return NextResponse.json({
      success: true,
      message: `Índice del acero actualizado para ${body.month}/${body.year} basado en dólar: $${body.newDollarRate}`,
      data: {
        month: body.month,
        year: body.year,
        newDollarRate: body.newDollarRate
      }
    });
  } catch (error) {
    console.error('Error updating steel index:', error);
    return NextResponse.json(
      { 
        error: 'Error al actualizar índice del acero', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
