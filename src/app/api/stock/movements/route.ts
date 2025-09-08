import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Valid movement types
const MOVEMENT_TYPES = [
  'PRODUCTION_ENTRY',
  'DISPATCH_EXIT',
  'ADJUSTMENT_POSITIVE',
  'ADJUSTMENT_NEGATIVE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RETURN_ENTRY',
  'DAMAGE_EXIT',
] as const;

// Validation schema for stock movement
const stockMovementSchema = z.object({
  pieceId: z.string().min(1, 'ID de pieza es requerido'),
  plantId: z.string().min(1, 'ID de planta es requerido'),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  type: z.enum(MOVEMENT_TYPES),
  budgetId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = stockMovementSchema.parse(body);

    // Validate piece exists
    const piece = await prisma.piece.findUnique({
      where: { id: validatedData.pieceId },
      include: {
        family: true,
      },
    });

    if (!piece) {
      return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 });
    }

    // Validate plant exists
    const plant = await prisma.plant.findUnique({
      where: { id: validatedData.plantId },
    });

    if (!plant) {
      return NextResponse.json({ error: 'Planta no encontrada' }, { status: 404 });
    }

    // If budget is specified, validate it exists
    if (validatedData.budgetId) {
      const budget = await prisma.budget.findUnique({
        where: { id: validatedData.budgetId },
      });

      if (!budget) {
        return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
      }
    }

    // Calculate the quantity change based on movement type
    let quantityChange = validatedData.quantity;
    const isEntry = ['PRODUCTION_ENTRY', 'ADJUSTMENT_POSITIVE', 'TRANSFER_IN', 'RETURN_ENTRY'].includes(validatedData.type);
    const isExit = ['DISPATCH_EXIT', 'ADJUSTMENT_NEGATIVE', 'TRANSFER_OUT', 'DAMAGE_EXIT'].includes(validatedData.type);

    if (isExit) {
      quantityChange = -quantityChange;
    }

    // Create movement and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get or create stock item
      let stockItem = await tx.stockItem.findUnique({
        where: {
          pieceId_plantId: {
            pieceId: validatedData.pieceId,
            plantId: validatedData.plantId,
          },
        },
      });

      if (!stockItem) {
        stockItem = await tx.stockItem.create({
          data: {
            pieceId: validatedData.pieceId,
            plantId: validatedData.plantId,
            quantity: 0,
          },
        });
      }

      // Check if exit movement would result in negative stock
      const newQuantity = stockItem.quantity + quantityChange;
      if (newQuantity < 0) {
        throw new Error(`Stock insuficiente. Stock actual: ${stockItem.quantity}, cantidad requerida: ${validatedData.quantity}`);
      }

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          pieceId: validatedData.pieceId,
          plantId: validatedData.plantId,
          quantity: quantityChange,
          type: validatedData.type,
          budgetId: validatedData.budgetId,
          notes: validatedData.notes,
          userId: session.user.id!,
        },
        include: {
          piece: {
            include: {
              family: true,
            },
          },
          plant: true,
          budget: {
            select: {
              id: true,
              version: true,
              customer: {
                select: {
                  companyName: true,
                },
              },
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Update stock quantity
      const updatedStockItem = await tx.stockItem.update({
        where: {
          pieceId_plantId: {
            pieceId: validatedData.pieceId,
            plantId: validatedData.plantId,
          },
        },
        data: {
          quantity: newQuantity,
        },
        include: {
          piece: {
            include: {
              family: true,
            },
          },
          plant: true,
        },
      });

      return { movement, stockItem: updatedStockItem };
    });

    // Generate appropriate success message
    let message = '';
    switch (validatedData.type) {
      case 'PRODUCTION_ENTRY':
        message = `Entrada de producción registrada: +${validatedData.quantity} unidades`;
        break;
      case 'DISPATCH_EXIT':
        message = `Despacho registrado: -${validatedData.quantity} unidades`;
        break;
      case 'ADJUSTMENT_POSITIVE':
        message = `Ajuste positivo registrado: +${validatedData.quantity} unidades`;
        break;
      case 'ADJUSTMENT_NEGATIVE':
        message = `Ajuste negativo registrado: -${validatedData.quantity} unidades`;
        break;
      default:
        message = `Movimiento registrado: ${quantityChange > 0 ? '+' : ''}${quantityChange} unidades`;
    }

    return NextResponse.json({
      success: true,
      movement: result.movement,
      stockItem: result.stockItem,
      message,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Stock insuficiente')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error('Error creating stock movement:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}