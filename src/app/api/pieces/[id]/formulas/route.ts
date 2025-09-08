import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PieceFormulaRequest {
  materialId: string;
  quantity: number;
  scrap?: number;
  unit: string;
  notes?: string;
}

// GET /api/pieces/[id]/formulas - Obtener fórmulas BOM de una pieza
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const pieceId = id;

    const formulas = await prisma.pieceMaterial.findMany({
      where: { pieceId },
      include: {
        material: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
            currentPrice: true,
            lastPriceUpdate: true
          }
        }
      },
      orderBy: { material: { name: 'asc' } }
    });

    return NextResponse.json({
      success: true,
      data: formulas.map(f => ({
        id: f.id,
        materialId: f.materialId,
        material: f.material,
        quantity: f.quantity,
        scrapPercent: f.scrapPercent,
        notes: f.notes,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching piece formulas:', error);
    return NextResponse.json(
      { error: 'Error al obtener fórmulas de la pieza' },
      { status: 500 }
    );
  }
}

// POST /api/pieces/[id]/formulas - Crear nueva fórmula BOM
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pieceId = id;
    const body: PieceFormulaRequest = await req.json();

    if (!body.materialId || !body.quantity || !body.unit) {
      return NextResponse.json(
        { error: 'materialId, quantity y unit son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la pieza existe
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId }
    });

    if (!piece) {
      return NextResponse.json(
        { error: 'Pieza no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el material existe
    const material = await prisma.material.findUnique({
      where: { id: body.materialId }
    });

    if (!material) {
      return NextResponse.json(
        { error: 'Material no encontrado' },
        { status: 404 }
      );
    }

    // Crear la relación (usando PieceMaterial por compatibilidad)
    const formula = await prisma.pieceMaterial.create({
      data: {
        pieceId,
        materialId: body.materialId,
        quantity: body.quantity,
        scrapPercent: body.scrap || 0,
        notes: body.notes
      },
      include: {
        material: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
            currentPrice: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Fórmula BOM creada exitosamente',
      data: formula
    });
  } catch (error) {
    console.error('Error creating piece formula:', error);
    return NextResponse.json(
      { error: 'Error al crear fórmula BOM' },
      { status: 500 }
    );
  }
}

// PUT /api/pieces/[id]/formulas - Actualizar múltiples fórmulas BOM
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pieceId = id;
    const body: { formulas: (PieceFormulaRequest & { id?: string })[] } = await req.json();

    if (!body.formulas || !Array.isArray(body.formulas)) {
      return NextResponse.json(
        { error: 'formulas debe ser un array' },
        { status: 400 }
      );
    }

    // Usar transacción para actualizar todas las fórmulas
    const result = await prisma.$transaction(async (tx) => {
      // Eliminar fórmulas existentes
      await tx.pieceMaterial.deleteMany({
        where: { pieceId }
      });

      // Crear nuevas fórmulas
      const createdFormulas = [];
      for (const formula of body.formulas) {
        const created = await tx.pieceMaterial.create({
          data: {
            pieceId,
            materialId: formula.materialId,
            quantity: formula.quantity,
            scrapPercent: formula.scrap || 0,
            notes: formula.notes
          },
          include: {
            material: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                unit: true,
                currentPrice: true
              }
            }
          }
        });
        createdFormulas.push(created);
      }

      return createdFormulas;
    });

    return NextResponse.json({
      success: true,
      message: `${result.length} fórmulas BOM actualizadas exitosamente`,
      data: result
    });
  } catch (error) {
    console.error('Error updating piece formulas:', error);
    return NextResponse.json(
      { error: 'Error al actualizar fórmulas BOM' },
      { status: 500 }
    );
  }
}
