import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { baseMonth, baseYear, targetMonth, targetYear } = body;

    // Obtener los índices base
    const baseIndex = await prisma.monthlyIndex.findUnique({
      where: {
        month_year: {
          month: baseMonth,
          year: baseYear
        }
      }
    });

    if (!baseIndex) {
      return NextResponse.json({ error: 'No se encontró el índice base' }, { status: 404 });
    }

    // Obtener los índices objetivo
    const targetIndex = await prisma.monthlyIndex.findUnique({
      where: {
        month_year: {
          month: targetMonth,
          year: targetYear
        }
      }
    });

    if (!targetIndex) {
      return NextResponse.json({ error: 'No se encontró el índice objetivo' }, { status: 404 });
    }

    // Obtener los coeficientes de la fórmula polinómica activa
    const formula = await prisma.polynomialFormula.findFirst({
      where: {
        isActive: true,
        effectiveDate: { lte: new Date() },
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } }
        ]
      }
    });

    const coefficients = {
      steelCoefficient: formula?.steelCoefficient || 0.4172,
      laborCoefficient: formula?.laborCoefficient || 0.30969,
      concreteCoefficient: formula?.concreteCoefficient || 0.207,
      fuelCoefficient: formula?.fuelCoefficient || 0.101
    };

    // Calcular el factor de ajuste
    const steelFactor = (targetIndex.steelIndex / baseIndex.steelIndex) * coefficients.steelCoefficient;
    const laborFactor = (targetIndex.laborIndex / baseIndex.laborIndex) * coefficients.laborCoefficient;
    const concreteFactor = (targetIndex.concreteIndex / baseIndex.concreteIndex) * coefficients.concreteCoefficient;
    const fuelFactor = (targetIndex.fuelIndex / baseIndex.fuelIndex) * coefficients.fuelCoefficient;

    const totalFactor = steelFactor + laborFactor + concreteFactor + fuelFactor;
    const adjustmentPercentage = (totalFactor - 1) * 100;

    return NextResponse.json({
      baseIndex,
      targetIndex,
      coefficients,
      factors: {
        steel: steelFactor,
        labor: laborFactor,
        concrete: concreteFactor,
        fuel: fuelFactor
      },
      totalFactor,
      adjustmentPercentage
    });
  } catch (error) {
    console.error('Error calculating adjustment:', error);
    return NextResponse.json({ error: 'Error al calcular el ajuste' }, { status: 500 });
  }
}
