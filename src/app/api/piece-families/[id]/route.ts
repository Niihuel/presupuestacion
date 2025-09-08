import { NextRequest } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar permisos
    const session = await requirePermission("piece-families", "view");
    const { id } = await params;

    const pieceFamily = await prisma.pieceFamily.findUnique({
      where: { id },
      include: {
        pieces: {
          select: {
            id: true,
            description: true,
            plant: {
              select: {
                name: true
              }
            }
          },
          take: 10 // Solo mostrar las primeras 10 piezas en vista detallada
        },
        molds: {
          select: {
            id: true,
            code: true,
            description: true,
            active: true,
            plant: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            pieces: true,
            molds: true,
            pieceRecipes: true
          }
        }
      }
    });

    if (!pieceFamily) {
      return jsonError("La familia de pieza solicitada no existe o ha sido eliminada.", 404);
    }

    return jsonOK(pieceFamily);
  } catch (error) {
    console.error('Error fetching piece family:', error);
    
    if (error instanceof Error && error.message.includes('permission')) {
      return jsonError("No tienes permisos para ver los detalles de familias de piezas. Contacta al administrador del sistema.", 403);
    }
    
    return jsonError("Error interno del servidor al obtener la familia de pieza. Por favor, intenta nuevamente o contacta al soporte técnico.", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar permisos
    const session = await requirePermission("piece-families", "edit");
    const body = await req.json();
    const { id } = await params;

    // Validar que la familia existe antes de actualizar
    const existingFamily = await prisma.pieceFamily.findUnique({
      where: { id },
      select: { id: true, code: true, description: true }
    });

    if (!existingFamily) {
      return jsonError("La familia de pieza que intentas actualizar no existe o ha sido eliminada.", 404);
    }

    // Validar campos requeridos
    if (!body.code?.trim()) {
      return jsonError("El código de la familia es requerido.", 400);
    }

    // Actualizar familia de piezas
    const updatedFamily = await prisma.pieceFamily.update({
      where: { id },
      data: {
        code: body.code.trim().toUpperCase(),
        description: body.description?.trim() || null,
        category: body.category?.trim() || null,
        requiresMold: Boolean(body.requiresMold),
        requiresCables: Boolean(body.requiresCables),
        requiresVaporCycle: Boolean(body.requiresVaporCycle),
        maxCables: body.maxCables ? parseInt(body.maxCables) : null,
        defaultConcreteType: body.defaultConcreteType?.trim() || null
      },
      include: {
        _count: {
          select: {
            pieces: true,
            molds: true
          }
        }
      }
    });

    // Registrar auditoría
    await writeAuditLog({
      action: 'update',
      resource: 'piece-family',
      resourceId: id,
      detail: `Familia de pieza actualizada: ${body.code} - ${body.description || 'Sin descripción'}`,
      userId: session.id
    });

    return jsonOK(updatedFamily);
  } catch (error) {
    console.error('Error updating piece family:', error);
    
    if (error instanceof Error && error.message.includes('permission')) {
      return jsonError("No tienes permisos para editar familias de piezas. Contacta al administrador del sistema.", 403);
    }
    
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return jsonError("Ya existe una familia de pieza con ese código. El código debe ser único.", 409);
        case 'P2003':
          return jsonError("Referencia inválida en los datos proporcionados.", 400);
        case 'P2025':
          return jsonError("La familia de pieza que intentas actualizar no existe.", 404);
        default:
          return jsonError("Error de base de datos al actualizar la familia de pieza. Verifica los datos e intenta nuevamente.", 400);
      }
    }
    
    return jsonError("Error interno del servidor al actualizar la familia de pieza. Por favor, intenta nuevamente o contacta al soporte técnico.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar permisos
    const session = await requirePermission("piece-families", "delete");
    const { id } = await params;

    // Obtener información de la familia antes de eliminarla para auditoría
    const familyToDelete = await prisma.pieceFamily.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        description: true,
        _count: {
          select: {
            pieces: true,
            molds: true,
            pieceRecipes: true
          }
        }
      }
    });

    if (!familyToDelete) {
      return jsonError("La familia de pieza que intentas eliminar no existe o ya ha sido eliminada.", 404);
    }

    // Verificar si la familia está siendo usada
    if (familyToDelete._count.pieces > 0) {
      return jsonError(`No se puede eliminar la familia porque tiene ${familyToDelete._count.pieces} pieza(s) asociada(s). Primero debes eliminar o reasignar las piezas.`, 409);
    }

    if (familyToDelete._count.molds > 0) {
      return jsonError(`No se puede eliminar la familia porque tiene ${familyToDelete._count.molds} molde(s) asociado(s). Primero debes eliminar o reasignar los moldes.`, 409);
    }

    if (familyToDelete._count.pieceRecipes > 0) {
      return jsonError(`No se puede eliminar la familia porque tiene ${familyToDelete._count.pieceRecipes} receta(s) asociada(s). Primero debes eliminar las recetas.`, 409);
    }

    // Eliminar familia de piezas
    await prisma.pieceFamily.delete({
      where: { id }
    });

    // Registrar auditoría
    await writeAuditLog({
      action: 'delete',
      resource: 'piece-family',
      resourceId: id,
      detail: `Familia de pieza eliminada: ${familyToDelete.code} - ${familyToDelete.description || 'Sin descripción'}`,
      userId: session.id
    });

    return jsonOK({ message: "Familia de pieza eliminada exitosamente" });
  } catch (error) {
    console.error('Error deleting piece family:', error);
    
    if (error instanceof Error && error.message.includes('permission')) {
      return jsonError("No tienes permisos para eliminar familias de piezas. Contacta al administrador del sistema.", 403);
    }
    
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2003':
          return jsonError("No se puede eliminar la familia de pieza porque está siendo referenciada por otros registros. Elimina primero las referencias.", 409);
        case 'P2025':
          return jsonError("La familia de pieza que intentas eliminar no existe.", 404);
        default:
          return jsonError("Error de base de datos al eliminar la familia de pieza. Por favor, intenta nuevamente.", 400);
      }
    }
    
    return jsonError("Error interno del servidor al eliminar la familia de pieza. Por favor, intenta nuevamente o contacta al soporte técnico.", 500);
  }
}