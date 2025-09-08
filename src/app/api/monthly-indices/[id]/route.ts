import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { monthlyIndexSchema } from '@/lib/validations/rates';
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requirePermission("parameters", "update");

    const body = await req.json();
    const parsed = monthlyIndexSchema.partial().safeParse(body);
    
    if (!parsed.success) {
      return jsonError("Validation error", 400, parsed.error.flatten());
    }
    
    const index = await prisma.monthlyIndex.update({
      where: { id },
      data: {
        steelIndex: parsed.data.steelIndex,
        laborIndex: parsed.data.laborIndex,
        concreteIndex: parsed.data.concreteIndex,
        fuelIndex: parsed.data.fuelIndex,
        dollar: parsed.data.dollar,
        source: 'MANUAL'
      }
    });

    return jsonOK(index);
  } catch (error) {
    console.error('Error updating monthly index:', error);
    return jsonError('Error al actualizar índice mensual', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requirePermission("parameters", "delete");

    await prisma.monthlyIndex.delete({
      where: { id }
    });

    return jsonOK({ message: 'Índice eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting monthly index:', error);
    return jsonError('Error al eliminar índice mensual', 500);
  }
}