import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for Additional
const additionalSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  unit: z.string().min(1, 'La unidad es requerida'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  category: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

// Query parameters validation
const additionalListSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.string().optional(),
  sortBy: z.string().optional().default('description'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = additionalListSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      sortBy: searchParams.get('sortBy') || 'description',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    });

    const page = parseInt(validatedParams.page);
    const limit = parseInt(validatedParams.limit);
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (validatedParams.search) {
      where.OR = [
        { description: { contains: validatedParams.search } },
        { unit: { contains: validatedParams.search } },
        { category: { contains: validatedParams.search } },
      ];
    }

    if (validatedParams.category) {
      where.category = validatedParams.category;
    }

    if (validatedParams.isActive !== undefined) {
      where.isActive = validatedParams.isActive === 'true';
    }

    // Get total count for pagination
    const totalCount = await prisma.additional.count({ where });

    // Get additionals
    const additionals = await prisma.additional.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [validatedParams.sortBy]: validatedParams.sortOrder,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      additionals,
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
    console.error('Error fetching additionals:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = additionalSchema.parse(body);

    const additional = await prisma.additional.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      additional,
      message: 'Adicional creado exitosamente',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating additional:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}