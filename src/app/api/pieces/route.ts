import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";

interface PieceMaterialInput {
  materialId: string;
  quantity: number;
  scrap: number;
}

interface PieceInput {
  familyId: string;
  plantId?: string;
  moldId?: string;
  description: string;
  weight?: number;
  width?: number;
  length?: number;
  thickness?: number;
  height?: number;
  section?: string;
  volume?: number;
  unitMeasure?: string;
  allowsOptional?: boolean;
  individualTransport?: boolean;
  piecesPerTruck?: number;
  productionTime?: number;
  concreteType?: string;
  steelQuantity?: number;
  requiresEscort?: boolean;
  maxStackable?: number;
  specialHandling?: string;
  materials: PieceMaterialInput[];
}

export async function GET(req: NextRequest) {
  try {
    await requirePermission("pieces", "view");
    const url = new URL(req.url);
    const { skip, take } = parsePagination(url);
    const familyId = url.searchParams.get('familyId');
    const plantId = url.searchParams.get('plantId');
    const q = url.searchParams.get('q')?.trim();
    
    const where: any = {};
    if (familyId) where.familyId = familyId;
    if (plantId) where.plantId = plantId;
    if (q) where.OR = [
      { description: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } }
    ];

    const [items, total] = await Promise.all([
      prisma.piece.findMany({
        skip,
        take,
        where,
        include: {
          family: {
            select: {
              id: true,
              code: true,
              description: true
            }
          },
          plant: {
            select: {
              id: true,
              name: true
            }
          },
          mold: {
            select: {
              id: true,
              code: true,
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
                  category: true
                }
              }
            }
          }
        },
        orderBy: { description: 'asc' }
      }),
      prisma.piece.count({ where })
    ]);

    return jsonOK({ items, total });
  } catch (error) {
    console.error('Error fetching pieces:', error);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return jsonError("Debes iniciar sesión para ver piezas", 401);
      }
      if (error.message.startsWith("Insufficient permissions")) {
        return jsonError("No tienes permisos para ver piezas", 403);
      }
    }
    return jsonError("Error interno del servidor", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("pieces", "create");
    const body: PieceInput = await req.json();

    // Validate required fields
    if (!body.familyId || !body.description) {
      return jsonError('familyId y description son requeridos', 400);
    }

    // Create piece with materials in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the piece
      const piece = await tx.piece.create({
        data: {
          familyId: body.familyId,
          plantId: body.plantId || null,
          moldId: body.moldId || null,
          description: body.description,
          weight: body.weight || null,
          width: body.width || null,
          length: body.length || null,
          thickness: body.thickness || null,
          height: body.height || null,
          section: body.section || null,
          volume: body.volume || null,
          unitMeasure: body.unitMeasure || null,
          allowsOptional: body.allowsOptional || false,
          individualTransport: body.individualTransport || false,
          piecesPerTruck: body.piecesPerTruck || null,
          productionTime: body.productionTime || null,
          concreteType: body.concreteType || null,
          steelQuantity: body.steelQuantity || null,
          requiresEscort: body.requiresEscort || false,
          maxStackable: body.maxStackable || null,
          specialHandling: body.specialHandling || null,
        }
      });

      // Create material relationships (BOM)
      if (body.materials && body.materials.length > 0) {
        await tx.pieceMaterial.createMany({
          data: body.materials.map(material => ({
            pieceId: piece.id,
            materialId: material.materialId,
            quantity: material.quantity,
            scrapPercent: material.scrap || 0
          }))
        });
      }

      return piece;
    });

    // Return the created piece with its relationships
    const createdPiece = await prisma.piece.findUnique({
      where: { id: result.id },
      include: {
        family: {
          select: {
            id: true,
            code: true,
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
                category: true
              }
            }
          }
        }
      }
    });

    await writeAuditLog({
      action: "create",
      resource: "piece",
      resourceId: result.id,
      detail: `Pieza creada: ${result.description}`
    });

    return jsonCreated(createdPiece);
  } catch (error) {
    console.error('Error creating piece:', error);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return jsonError("Debes iniciar sesión para crear piezas", 401);
      }
      if (error.message.startsWith("Insufficient permissions")) {
        return jsonError("No tienes permisos para crear piezas", 403);
      }
      // Check for unique constraint violation
      if ('code' in error && (error as any).code === 'P2002') {
        return jsonError("Ya existe una pieza con este código", 409);
      }
    }
    return jsonError("Error interno del servidor", 500);
  }
}


