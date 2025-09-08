import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Valid budget statuses
const BUDGET_STATUSES = ['DRAFT', 'PRESENTED', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

// Status transition rules
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PRESENTED', 'CANCELLED'],
  PRESENTED: ['APPROVED', 'REJECTED', 'CANCELLED', 'DRAFT'],
  APPROVED: ['CANCELLED'],
  REJECTED: ['DRAFT', 'CANCELLED'],
  CANCELLED: [], // No transitions from cancelled
};

const statusUpdateSchema = z.object({
  status: z.enum(BUDGET_STATUSES),
  comments: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const validatedData = statusUpdateSchema.parse(body);

    // Get the current budget
    const budget = await prisma.budget.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        version: true,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Validate status transition
    const currentStatus = budget.status;
    const newStatus = validatedData.status;

    if (currentStatus === newStatus) {
      return NextResponse.json({ error: 'El presupuesto ya tiene este estado' }, { status: 400 });
    }

    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Transición de estado no válida: no se puede cambiar de ${currentStatus} a ${newStatus}`,
          allowedTransitions,
        },
        { status: 400 }
      );
    }

    // Update budget status and create tracking entry in a transaction
    const updatedBudget = await prisma.$transaction(async (tx) => {
      // Update the budget status
      const updated = await tx.budget.update({
        where: { id },
        data: {
          status: newStatus,
          lastEditedAt: new Date(),
        },
        include: {
          customer: {
            select: {
              companyName: true,
            },
          },
          project: {
            select: {
              name: true,
            },
          },
        },
      });

      // Create tracking entry
      await tx.budgetTracking.create({
        data: {
          budgetId: id,
          status: newStatus,
          comments: validatedData.comments || `Estado cambiado de ${currentStatus} a ${newStatus}`,
          changedBy: session.user.id!,
        },
      });

      return updated;
    });

    // Additional logic based on status change
    let additionalMessage = '';
    switch (newStatus) {
      case 'PRESENTED':
        additionalMessage = 'El presupuesto ha sido presentado al cliente';
        break;
      case 'APPROVED':
        additionalMessage = 'El presupuesto ha sido aprobado por el cliente';
        break;
      case 'REJECTED':
        additionalMessage = 'El presupuesto ha sido rechazado por el cliente';
        break;
      case 'CANCELLED':
        additionalMessage = 'El presupuesto ha sido cancelado';
        break;
    }

    return NextResponse.json({
      success: true,
      budget: updatedBudget,
      message: `Estado del presupuesto actualizado a ${newStatus}. ${additionalMessage}`,
      previousStatus: currentStatus,
      newStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating budget status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}