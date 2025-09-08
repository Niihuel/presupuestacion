import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authz';
import { z } from 'zod';

// Query parameters validation for stock listing
const stockListSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  plantId: z.string().optional(),
  familyId: z.string().optional(),
  sortBy: z.string().optional().default('piece'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar permisos para ver stock
    await requirePermission("stock", "view");

    const { searchParams } = new URL(request.url);
    const validatedParams = stockListSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      plantId: searchParams.get('plantId') || undefined,
      familyId: searchParams.get('familyId') || undefined,
      sortBy: searchParams.get('sortBy') || 'piece',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    });

    const page = parseInt(validatedParams.page);
    const limit = parseInt(validatedParams.limit);
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (validatedParams.search) {
      where.OR = [
        { piece: { description: { contains: validatedParams.search } } },
        { piece: { family: { code: { contains: validatedParams.search } } } },
        { plant: { name: { contains: validatedParams.search } } },
        { location: { contains: validatedParams.search } },
      ];
    }

    if (validatedParams.plantId) {
      where.plantId = validatedParams.plantId;
    }

    if (validatedParams.familyId) {
      where.piece = {
        familyId: validatedParams.familyId,
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.stockItem.count({ where });

    // Get stock items with related data
    const stockItems = await prisma.stockItem.findMany({
      where,
      skip,
      take: limit,
      include: {
        piece: {
          include: {
            family: {
              select: {
                id: true,
                code: true,
                description: true,
              },
            },
          },
        },
        plant: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: validatedParams.sortBy === 'piece' 
        ? { piece: { description: validatedParams.sortOrder } }
        : validatedParams.sortBy === 'plant'
        ? { plant: { name: validatedParams.sortOrder } }
        : { [validatedParams.sortBy]: validatedParams.sortOrder },
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Calculate totals
    const totalPieces = stockItems.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      stockItems,
      summary: {
        totalItems: totalCount,
        totalPieces,
      },
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
    console.error('Error fetching stock:', error);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Debes iniciar sesión para ver el stock", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      if (error.message.startsWith("Insufficient permissions")) {
        return NextResponse.json(
          { 
            error: "No tienes permisos para ver el stock", 
            code: "INSUFFICIENT_PERMISSIONS",
            requiredPermission: "stock:view"
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