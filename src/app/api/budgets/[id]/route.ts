import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authz';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permisos para ver presupuestos
    await requirePermission("budgets", "view");

    const { id } = await params;

    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            projects: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          include: {
            designer: true,
            files: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            piece: {
              include: {
                family: true,
                plant: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
        additionals: {
          orderBy: {
            id: 'asc',
          },
        },
        freight: {
          include: {
            pieces: {
              include: {
                piece: {
                  include: {
                    family: true,
                  },
                },
              },
            },
          },
          orderBy: {
            truckNumber: 'asc',
          },
        },
        pieces: {
          include: {
            piece: {
              include: {
                family: true,
                plant: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
        tracking: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            changedAt: 'desc',
          },
        },
        observations: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        parentBudget: {
          select: {
            id: true,
            version: true,
            status: true,
            createdAt: true,
          },
        },
        versions: {
          select: {
            id: true,
            version: true,
            status: true,
            createdAt: true,
            finalTotal: true,
          },
          orderBy: {
            version: 'desc',
          },
        },
        freightCalculations: true,
        stockMovements: {
          include: {
            piece: {
              include: {
                family: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ budget });
  } catch (error) {
    console.error('Error fetching budget detail:', error);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Debes iniciar sesión para ver presupuestos", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      if (error.message.startsWith("Insufficient permissions")) {
        return NextResponse.json(
          { 
            error: "No tienes permisos para ver presupuestos", 
            code: "INSUFFICIENT_PERMISSIONS",
            requiredPermission: "budgets:view"
          },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}