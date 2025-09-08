import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the original budget with all its related data
    const originalBudget = await prisma.budget.findUnique({
      where: { id },
      include: {
        items: true,
        additionals: true,
        freight: {
          include: {
            pieces: true,
          },
        },
        pieces: true,
      },
    });

    if (!originalBudget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Create the new budget version in a transaction
    const newBudget = await prisma.$transaction(async (tx) => {
      // Create the new budget version
      const newBudgetVersion = await tx.budget.create({
        data: {
          projectId: originalBudget.projectId,
          version: originalBudget.version + 1,
          customerId: originalBudget.customerId,
          userId: session.user.id!,
          sellerId: originalBudget.sellerId,
          status: 'DRAFT', // New version starts as draft
          parentBudgetId: originalBudget.id, // Link to original budget
          requestDate: originalBudget.requestDate,
          budgetDate: new Date(), // Update budget date to current
          deliveryTerms: originalBudget.deliveryTerms,
          paymentConditions: originalBudget.paymentConditions,
          validityDays: originalBudget.validityDays,
          notes: originalBudget.notes,
          totalMaterials: originalBudget.totalMaterials,
          totalFreight: originalBudget.totalFreight,
          totalAssembly: originalBudget.totalAssembly,
          totalAdditionals: originalBudget.totalAdditionals,
          taxes: originalBudget.taxes,
          finalTotal: originalBudget.finalTotal,
          isDraft: false, // This is a complete budget, not a draft
          draftStep: null,
          draftData: null,
          completedSteps: '[]',
          resumeToken: null,
        },
      });

      // Duplicate all budget items
      if (originalBudget.items.length > 0) {
        await tx.budgetItem.createMany({
          data: originalBudget.items.map((item) => ({
            budgetId: newBudgetVersion.id,
            pieceId: item.pieceId,
            quantity: item.quantity,
            truckNumber: item.truckNumber,
            length: item.length,
            unitPrice: item.unitPrice,
            adjustment: item.adjustment,
            originPlant: item.originPlant,
            optional: item.optional,
            subtotal: item.subtotal,
          })),
        });
      }

      // Duplicate all budget additionals
      if (originalBudget.additionals.length > 0) {
        await tx.budgetAdditional.createMany({
          data: originalBudget.additionals.map((additional) => ({
            budgetId: newBudgetVersion.id,
            description: additional.description,
            quantity: additional.quantity,
            unitPrice: additional.unitPrice,
            total: additional.total,
          })),
        });
      }

      // Duplicate all budget pieces
      if (originalBudget.pieces.length > 0) {
        await tx.budgetPiece.createMany({
          data: originalBudget.pieces.map((piece) => ({
            budgetId: newBudgetVersion.id,
            pieceId: piece.pieceId,
            quantity: piece.quantity,
            unitPrice: piece.unitPrice,
            totalPrice: piece.totalPrice,
            transportKm: piece.transportKm,
            specialRequirements: piece.specialRequirements,
          })),
        });
      }

      // Duplicate freight information
      for (const freight of originalBudget.freight) {
        const newFreight = await tx.budgetFreight.create({
          data: {
            budgetId: newBudgetVersion.id,
            truckNumber: freight.truckNumber,
            realWeight: freight.realWeight,
            falseWeight: freight.falseWeight,
            maxCapacity: freight.maxCapacity,
            pieceCount: freight.pieceCount,
            over12m: freight.over12m,
            requiresEscort: freight.requiresEscort,
            cost: freight.cost,
          },
        });

        // Duplicate freight pieces
        if (freight.pieces.length > 0) {
          await tx.budgetFreightPiece.createMany({
            data: freight.pieces.map((piece) => ({
              budgetFreightId: newFreight.id,
              pieceId: piece.pieceId,
              quantity: piece.quantity,
            })),
          });
        }
      }

      // Create tracking entry for the new version
      await tx.budgetTracking.create({
        data: {
          budgetId: newBudgetVersion.id,
          status: 'DRAFT',
          comments: `Nueva versión ${newBudgetVersion.version} creada desde versión ${originalBudget.version}`,
          changedBy: session.user.id!,
        },
      });

      return newBudgetVersion;
    });

    return NextResponse.json({
      success: true,
      budgetId: newBudget.id,
      version: newBudget.version,
      message: `Nueva versión ${newBudget.version} creada exitosamente`,
    });
  } catch (error) {
    console.error('Error creating budget version:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}