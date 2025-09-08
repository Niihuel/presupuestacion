import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { CostCalculationService } from '@/lib/services/cost-calculation.service';

interface BudgetPieceInput {
  pieceId: string;
  quantity: number;
  transportKm?: number;
  specialRequirements?: string;
  unitPrice?: number; // Optional override
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const budgetId = id;

    const existingPieces = await (prisma as any).budgetPiece.findMany({
      where: { budgetId },
      include: {
        piece: {
          include: {
            family: {
              select: {
                id: true,
                description: true
              }
            },
            materials: {
              include: {
                material: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    currentPrice: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ pieces: existingPieces });
  } catch (error) {
    console.error('Error fetching budget pieces:', error);
    return NextResponse.json({ error: 'Error al obtener piezas del presupuesto' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const budgetId = id;
    const body: BudgetPieceInput = await req.json();

    if (!body.pieceId || !body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'pieceId y quantity son requeridos' },
        { status: 400 }
      );
    }

    // Verify budget exists
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId }
    });

    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Verify piece exists
    const piece = await prisma.piece.findUnique({
      where: { id: body.pieceId }
    });

    if (!piece) {
      return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 });
    }

    // Check if piece already exists in budget
    const existingPiece = await (prisma as any).budgetPiece.findUnique({
      where: {
        budgetId: budgetId,
        pieceId: body.pieceId
      }
    });

    if (existingPiece) {
      return NextResponse.json(
        { error: 'La pieza ya existe en el presupuesto' },
        { status: 409 }
      );
    }

    // Calculate cost using the cost calculation service
    const costService = new CostCalculationService();
    let unitPrice = body.unitPrice;

    if (!unitPrice) {
      try {
        const costResult = await costService.calculateTotalCost({
          pieceId: body.pieceId,
          quantity: body.quantity,
          budgetDate: budget.budgetDate || new Date()
        });

        // Add freight cost if transport distance provided
        let freightCost = 0;
        if (body.transportKm) {
          const piece = await prisma.piece.findUnique({ where: { id: body.pieceId } });
          if (!piece) throw new Error('Piece not found');
          
          const freightResult = await costService.calculateFreightCost(
            [{ id: body.pieceId, weight: piece.weight || 0, length: piece.length || 0 }],
            'CO',
            body.transportKm
          );
          freightCost = freightResult.totalCost;
        }

        unitPrice = (costResult + freightCost) / body.quantity;
      } catch (error) {
        console.error('Error calculating piece cost:', error);
        // Use a default price or return error
        unitPrice = 0;
      }
    }

    const totalPrice = unitPrice * body.quantity;

    // Create budget piece
    const newPiece = await (prisma as any).budgetPiece.create({
      data: {
        budgetId: budgetId,
        pieceId: body.pieceId,
        quantity: body.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        transportKm: body.transportKm || null,
        specialRequirements: body.specialRequirements || null
      },
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

    // Update budget total (optional - could be calculated on-demand)
    const budgetTotal = await prisma.budgetPiece.aggregate({
      where: { budgetId: budgetId },
      _sum: { totalPrice: true }
    });

    await prisma.budget.update({
      where: { id: budgetId },
      data: { 
        finalTotal: budgetTotal._sum.totalPrice || 0,
        lastEditedAt: new Date()
      }
    });

    return NextResponse.json(newPiece, { status: 201 });
  } catch (error) {
    console.error('Error adding piece to budget:', error);
    return NextResponse.json({ error: 'Error al agregar pieza al presupuesto' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const budgetId = id;
    const updates: Array<{ pieceId: string; quantity?: number; unitPrice?: number; transportKm?: number }> = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Se esperaba un array de actualizaciones' }, { status: 400 });
    }

    const results = await prisma.$transaction(async (tx) => {
      const updatedPieces = [];

      for (const update of updates) {
        if (!update.pieceId) continue;

        const budgetPiece = await tx.budgetPiece.findFirst({
          where: {
            budgetId: budgetId,
            pieceId: update.pieceId
          }
        });

        if (!budgetPiece) continue;

        const updateData: any = {};
        
        if (update.quantity !== undefined) {
          updateData.quantity = update.quantity;
          updateData.totalPrice = (update.unitPrice || budgetPiece.unitPrice) * update.quantity;
        }
        
        if (update.unitPrice !== undefined) {
          updateData.unitPrice = update.unitPrice;
          updateData.totalPrice = update.unitPrice * (update.quantity || budgetPiece.quantity);
        }

        if (update.transportKm !== undefined) {
          updateData.transportKm = update.transportKm;
        }

        if (Object.keys(updateData).length > 0) {
          const updated = await (tx as any).budgetPiece.updateMany({
            where: { id: budgetPiece.id },
            data: updateData
          });
          updatedPieces.push(updated);
        }
      }

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

      return updatedPieces;
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating budget pieces:', error);
    return NextResponse.json({ error: 'Error al actualizar piezas del presupuesto' }, { status: 500 });
  }
}
