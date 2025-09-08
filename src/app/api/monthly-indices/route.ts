import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { monthlyIndexSchema } from '@/lib/validations/rates';
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("parameters", "view");
    
    const url = new URL(req.url);
    const year = url.searchParams.get('year');
    
    const where = year ? { year: parseInt(year) } : {};

    const indices = await prisma.monthlyIndex.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return jsonOK(indices);
  } catch (error) {
    console.error('Error fetching monthly indices:', error);
    return jsonError('Error al obtener índices mensuales', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("parameters", "create");
    
    const body = await req.json();
    const parsed = monthlyIndexSchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonError("Validation error", 400, parsed.error.flatten());
    }
    
    // Verificar si ya existe un índice para ese mes y año
    const existing = await prisma.monthlyIndex.findUnique({
      where: {
        month_year: {
          month: parsed.data.month,
          year: parsed.data.year
        }
      }
    });

    if (existing) {
      return jsonError('Ya existe un índice para ese mes y año', 400);
    }

    const newIndex = await prisma.monthlyIndex.create({
      data: {
        month: parsed.data.month,
        year: parsed.data.year,
        steelIndex: parsed.data.steelIndex,
        laborIndex: parsed.data.laborIndex,
        concreteIndex: parsed.data.concreteIndex,
        fuelIndex: parsed.data.fuelIndex,
        dollar: parsed.data.dollar,
        source: 'MANUAL',
        createdBy: null // session.user?.id when auth is enabled
      }
    });

    return jsonCreated(newIndex);
  } catch (error) {
    console.error('Error creating monthly index:', error);
    return jsonError('Error al crear índice mensual', 500);
  }
}