import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authz';
import { z } from 'zod';

// Validation schema for query parameters
const budgetListSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  projectId: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar permisos para ver presupuestos
    await requirePermission("budgets", "view");

    const { searchParams } = new URL(request.url);
    const validatedParams = budgetListSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    });

    const page = parseInt(validatedParams.page);
    const limit = parseInt(validatedParams.limit);
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      // Only show non-draft budgets (completed budgets)
      isDraft: false,
    };

    if (validatedParams.search) {
      where.OR = [
        { id: { contains: validatedParams.search } },
        { notes: { contains: validatedParams.search } },
        { customer: { companyName: { contains: validatedParams.search } } },
        { project: { name: { contains: validatedParams.search } } },
      ];
    }

    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    if (validatedParams.customerId) {
      where.customerId = validatedParams.customerId;
    }

    if (validatedParams.projectId) {
      where.projectId = validatedParams.projectId;
    }

    // Get total count for pagination
    const totalCount = await prisma.budget.count({ where });

    // Get budgets with related data
    const budgets = await prisma.budget.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [validatedParams.sortBy]: validatedParams.sortOrder,
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            displayName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
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
        parentBudget: {
          select: {
            id: true,
            version: true,
          },
        },
        versions: {
          select: {
            id: true,
            version: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            version: 'desc',
          },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      budgets,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
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