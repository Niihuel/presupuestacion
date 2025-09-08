import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for Additional updates
const additionalUpdateSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida').optional(),
  unit: z.string().min(1, 'La unidad es requerida').optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const additional = await prisma.additional.findUnique({
      where: { id },
    });

    if (!additional) {
      return NextResponse.json({ error: 'Adicional no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ additional });
  } catch (error) {
    console.error('Error fetching additional:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    const validatedData = additionalUpdateSchema.parse(body);

    // Check if additional exists
    const existingAdditional = await prisma.additional.findUnique({
      where: { id },
    });

    if (!existingAdditional) {
      return NextResponse.json({ error: 'Adicional no encontrado' }, { status: 404 });
    }

    const additional = await prisma.additional.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      additional,
      message: 'Adicional actualizado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating additional:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if additional exists
    const existingAdditional = await prisma.additional.findUnique({
      where: { id },
    });

    if (!existingAdditional) {
      return NextResponse.json({ error: 'Adicional no encontrado' }, { status: 404 });
    }

    // Instead of hard delete, mark as inactive
    const additional = await prisma.additional.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Adicional eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting additional:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}