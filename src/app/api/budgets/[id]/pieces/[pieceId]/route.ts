import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; pieceId: string }> }
) {
  try {
    const { id: budgetId, pieceId } = await params;

    // Find the budget piece
    const budgetPiece = await prisma.budgetPiece.findFirst({
      where: {
        budgetId: budgetId,
        pieceId: pieceId
      }
    });

    if (!budgetPiece) {
      return NextResponse.json({ error: 'Pieza no encontrada en el presupuesto' }, { status: 404 });
    }

    // Delete the budget piece and update budget total in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.budgetPiece.delete({
        where: { id: budgetPiece.id }
      });

      // Update budget total
      const budgetTotal = await tx.budgetPiece.aggregate({
        where: { budgetId: budgetId },
        _sum: { totalPrice: true }
      });

      await tx.budget.update({
        where: { id: budgetId },
        data: { 
          finalTotal: budgetTotal._sum.totalPrice || 0,
          lastEditedAt: new Date()
        }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error removing piece from budget:', error);
    return NextResponse.json({ error: 'Error al eliminar pieza del presupuesto' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; pieceId: string }> }
) {
  try {
    const { id: budgetId, pieceId } = await params;
    const body = await req.json();

    // Find the budget piece
    const budgetPiece = await prisma.budgetPiece.findFirst({
      where: {
        budgetId: budgetId,
        pieceId: pieceId
      }
    });

    if (!budgetPiece) {
      return NextResponse.json({ error: 'Pieza no encontrada en el presupuesto' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.quantity !== undefined && body.quantity > 0) {
      updateData.quantity = body.quantity;
      updateData.totalPrice = body.unitPrice !== undefined 
        ? body.unitPrice * body.quantity
        : budgetPiece.unitPrice * body.quantity;
    }

    if (body.unitPrice !== undefined) {
      updateData.unitPrice = body.unitPrice;
      updateData.totalPrice = body.unitPrice * (body.quantity || budgetPiece.quantity);
    }

    if (body.transportKm !== undefined) {
      updateData.transportKm = body.transportKm;
    }

    if (body.specialRequirements !== undefined) {
      updateData.specialRequirements = body.specialRequirements;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    // Update budget piece and budget total in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.budgetPiece.update({
        where: { id: budgetPiece.id },
        data: updateData,
        include: {
          piece: {
            include: {
              family: {
                select: {
                  id: true,
                  description: true
                }
              }
            }
          }
        }
      });

      // Update budget total
      const budgetTotal = await tx.budgetPiece.aggregate({
        where: { budgetId: budgetId },
        _sum: { totalPrice: true }
      });

      await tx.budget.update({
        where: { id: budgetId },
        data: { 
          finalTotal: budgetTotal._sum.totalPrice || 0,
          lastEditedAt: new Date()
        }
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating budget piece:', error);
    return NextResponse.json({ error: 'Error al actualizar pieza del presupuesto' }, { status: 500 });
  }
}
