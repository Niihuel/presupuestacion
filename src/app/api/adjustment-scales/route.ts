import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adjustmentScaleSchema } from '@/lib/validations/rates';
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("parameters", "view");
    
    const scales = await prisma.adjustmentScale.findMany({
      orderBy: [
        { isActive: 'desc' },
        { effectiveDate: 'desc' }
      ]
    });

    return jsonOK(scales);
  } catch (error) {
    console.error('Error fetching adjustment scales:', error);
    return jsonError('Error al obtener escalas de ajuste', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("parameters", "create");
    
    const body = await req.json();
    const parsed = adjustmentScaleSchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonError("Validation error", 400, parsed.error.flatten());
    }

    const scale = await prisma.adjustmentScale.create({
      data: {
        name: parsed.data.name,
        version: parsed.data.version,
        description: parsed.data.description,
        generalDiscount: parsed.data.generalDiscount,
        generalAdjustment: parsed.data.generalAdjustment,
        specialAdjustment: parsed.data.specialAdjustment,
        specialCategories: parsed.data.specialCategories,
        effectiveDate: new Date(parsed.data.effectiveDate),
        expirationDate: parsed.data.expirationDate ? new Date(parsed.data.expirationDate) : null,
        isActive: parsed.data.isActive || false,
        scales: parsed.data.scales || '[]',
        createdBy: null // session.user?.id when auth is enabled
      }
    });

    return jsonCreated(scale);
  } catch (error) {
    console.error('Error creating adjustment scale:', error);
    return jsonError('Error al crear escala de ajuste', 500);
  }
}