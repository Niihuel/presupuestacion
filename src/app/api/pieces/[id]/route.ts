import { NextRequest } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface PieceMaterialInput {
  materialId: string;
  quantity: number;
  scrap: number;
}

interface PieceUpdateInput {
  familyId?: string;
  plantId?: string;
  moldId?: string;
  description?: string;
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
  materials?: PieceMaterialInput[];
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar permisos
    const session = await requirePermission("pieces", "view");
    const { id } = await params;

    const piece = await prisma.piece.findUnique({
      where: { id },
      include: {
        family: {
          select: {
            id: true,
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

    if (!piece) {
      return jsonError("La pieza solicitada no existe o ha sido eliminada.", 404);
    }

    return jsonOK(piece);
  } catch (error) {
    console.error('Error fetching piece:', error);
    
    if (error instanceof Error && error.message.includes('permission')) {
      return jsonError("No tienes permisos para ver los detalles de piezas. Contacta al administrador del sistema.", 403);
    }
    
    return jsonError("Error interno del servidor al obtener la pieza. Por favor, intenta nuevamente o contacta al soporte técnico.", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar permisos
    const session = await requirePermission("pieces", "edit");
    const body: PieceUpdateInput = await req.json();
    const { id } = await params;

    // Validar que la pieza existe antes de actualizar
    const existingPiece = await prisma.piece.findUnique({
      where: { id },
      select: { id: true, description: true }
    });

    if (!existingPiece) {
      return jsonError("La pieza que intentas actualizar no existe o ha sido eliminada.", 404);
    }

    // Update piece with materials in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the piece
      const piece = await tx.piece.update({
        where: { id },
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

      // Update material relationships if provided
      if (body.materials !== undefined) {
        // Delete existing material relationships
        await tx.pieceMaterial.deleteMany({
          where: { pieceId: id }
        });

        // Create new material relationships
        if (body.materials.length > 0) {
          await tx.pieceMaterial.createMany({
            data: body.materials.map(material => ({
              pieceId: id,
              materialId: material.materialId,
              quantity: material.quantity,
              scrap: material.scrap || 0
            }))
          });
        }
      }

      return piece;
    });

    // Registrar auditoría
    await writeAuditLog({
      action: 'update',
      resource: 'piece',
      resourceId: id,
      detail: `Pieza actualizada: ${body.description || existingPiece.description}`,
      userId: session.id
    });

    // Return the updated piece with its relationships
    const updatedPiece = await prisma.piece.findUnique({
      where: { id },
      include: {
        family: {
          select: {
            id: true,
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

    return jsonOK(updatedPiece);
  } catch (error) {
    console.error('Error updating piece:', error);
    
    if (error instanceof Error && error.message.includes('permission')) {
      return jsonError("No tienes permisos para editar piezas. Contacta al administrador del sistema.", 403);
    }
    
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return jsonError("Ya existe una pieza con ese código. El código debe ser único.", 409);
        case 'P2003':
          return jsonError("Referencia inválida: la familia, planta o molde seleccionado no existe.", 400);
        case 'P2025':
          return jsonError("La pieza que intentas actualizar no existe.", 404);
        default:
          return jsonError("Error de base de datos al actualizar la pieza. Verifica los datos e intenta nuevamente.", 400);
      }
    }
    
    return jsonError("Error interno del servidor al actualizar la pieza. Por favor, intenta nuevamente o contacta al soporte técnico.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar permisos
    const session = await requirePermission("pieces", "delete");
    const { id } = await params;

    // Obtener información de la pieza antes de eliminarla para auditoría
    const pieceToDelete = await prisma.piece.findUnique({
      where: { id },
      select: {
        id: true,
        description: true
      }
    });

    if (!pieceToDelete) {
      return jsonError("La pieza que intentas eliminar no existe o ya ha sido eliminada.", 404);
    }

    // Verificar si la pieza está siendo usada en otros lugares
    const usage = await prisma.budgetItem.findFirst({
      where: { pieceId: id },
      select: { id: true }
    });

    if (usage) {
      return jsonError("No se puede eliminar la pieza porque está siendo utilizada en uno o más presupuestos. Primero debes eliminar las referencias en los presupuestos.", 409);
    }

    // Delete piece (cascade will handle materials)
    await prisma.piece.delete({
      where: { id }
    });

    // Registrar auditoría
    await writeAuditLog({
      action: 'delete',
      resource: 'piece',
      resourceId: id,
      detail: `Pieza eliminada: ${pieceToDelete.description}`,
      userId: session.id
    });

    return jsonOK({ message: "Pieza eliminada exitosamente" });
  } catch (error) {
    console.error('Error deleting piece:', error);
    
    if (error instanceof Error && error.message.includes('permission')) {
      return jsonError("No tienes permisos para eliminar piezas. Contacta al administrador del sistema.", 403);
    }
    
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2003':
          return jsonError("No se puede eliminar la pieza porque está siendo referenciada por otros registros. Elimina primero las referencias.", 409);
        case 'P2025':
          return jsonError("La pieza que intentas eliminar no existe.", 404);
        default:
          return jsonError("Error de base de datos al eliminar la pieza. Por favor, intenta nuevamente.", 400);
      }
    }
    
    return jsonError("Error interno del servidor al eliminar la pieza. Por favor, intenta nuevamente o contacta al soporte técnico.", 500);
  }
}


