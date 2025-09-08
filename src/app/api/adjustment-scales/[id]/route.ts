import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adjustmentScaleSchema } from '@/lib/validations/rates';
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requirePermission("parameters", "view");

    const scale = await prisma.adjustmentScale.findUnique({
      where: { id }
    });

    if (!scale) {
      return jsonError('Escala no encontrada', 404);
    }

    return jsonOK(scale);
  } catch (error) {
    console.error('Error fetching adjustment scale:', error);
    return jsonError('Error al obtener escala de ajuste', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requirePermission("parameters", "update");
    
    const body = await req.json();
    const parsed = adjustmentScaleSchema.partial().safeParse(body);
    
    if (!parsed.success) {
      return jsonError("Validation error", 400, parsed.error.flatten());
    }
    
    // Si se marca como activa, desactivar las demás
    if (parsed.data.isActive) {
      await prisma.adjustmentScale.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      });
    }

    const scale = await prisma.adjustmentScale.update({
      where: { id },
      data: {
        name: parsed.data.name,
        version: parsed.data.version,
        description: parsed.data.description,
        generalDiscount: parsed.data.generalDiscount,
        generalAdjustment: parsed.data.generalAdjustment,
        specialAdjustment: parsed.data.specialAdjustment,
        specialCategories: parsed.data.specialCategories,
        effectiveDate: parsed.data.effectiveDate ? new Date(parsed.data.effectiveDate) : undefined,
        expirationDate: parsed.data.expirationDate ? new Date(parsed.data.expirationDate) : null,
        isActive: parsed.data.isActive,
        scales: parsed.data.scales
      }
    });

    return jsonOK(scale);
  } catch (error) {
    console.error('Error updating adjustment scale:', error);
    return jsonError('Error al actualizar escala de ajuste', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requirePermission("parameters", "delete");

    const scale = await prisma.adjustmentScale.findUnique({
      where: { id }
    });

    if (!scale) {
      return jsonError('Escala no encontrada', 404);
    }

    if (scale.isActive) {
      return jsonError('No se puede eliminar una escala activa', 400);
    }

    await prisma.adjustmentScale.delete({
      where: { id }
    });

    return jsonOK({ message: 'Escala eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting adjustment scale:', error);
    return jsonError('Error al eliminar escala de ajuste', 500);
  }
}