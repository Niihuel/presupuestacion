import { NextRequest } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError, jsonCreated, parsePagination } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function GET(req: NextRequest) {
  try {
    // Verificar permisos
    const session = await requirePermission("piece-families", "view");
    
    const url = new URL(req.url);
    const { searchParams } = url;
    const { page, pageSize, skip, take } = parsePagination(url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const showActive = searchParams.get("active");

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { description: { contains: search } }
      ];
    }
    
    if (category) {
      where.category = { contains: category };
    }
    
    // Filtrar por estado activo/inactivo si se especifica
    if (showActive !== null) {
      // Para familias, no hay campo 'active', pero podemos usar la existencia de piezas activas
      // Por ahora, simplemente ignoramos este filtro
    }

    // Obtener familias con información de relaciones
    const [families, total] = await Promise.all([
      prisma.pieceFamily.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              pieces: true,
              molds: true
            }
          }
        },
        orderBy: [
          { code: 'asc' }
        ]
      }),
      prisma.pieceFamily.count({ where })
    ]);

    const pageCount = Math.ceil(total / pageSize);

    return jsonOK({
      items: families,
      pagination: {
        page,
        pageSize,
        total,
        pageCount,
        hasNextPage: page < pageCount,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching piece families:', error);
    
    if (error instanceof Error && error.message.includes('permission')) {
      return jsonError("No tienes permisos para ver las familias de piezas. Contacta al administrador del sistema.", 403);
    }
    
    return jsonError("Error interno del servidor al obtener las familias de piezas. Por favor, intenta nuevamente o contacta al soporte técnico.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar permisos
    const session = await requirePermission("piece-families", "create");
    
    const body = await req.json();
    
    // Validar campos requeridos
    if (!body.code?.trim()) {
      return jsonError("El código de la familia es requerido.", 400);
    }

    // Crear familia de piezas
    const pieceFamily = await prisma.pieceFamily.create({
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
      action: 'create',
      resource: 'piece-family',
      resourceId: pieceFamily.id,
      detail: `Familia de pieza creada: ${pieceFamily.code} - ${pieceFamily.description || 'Sin descripción'}`,
      userId: session.id
    });

    return jsonCreated(pieceFamily);
  } catch (error) {
    console.error('Error creating piece family:', error);
    
    if (error instanceof Error && error.message.includes('permission')) {
      return jsonError("No tienes permisos para crear familias de piezas. Contacta al administrador del sistema.", 403);
    }
    
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return jsonError("Ya existe una familia de pieza con ese código. El código debe ser único.", 409);
        case 'P2003':
          return jsonError("Referencia inválida en los datos proporcionados.", 400);
        default:
          return jsonError("Error de base de datos al crear la familia de pieza. Verifica los datos e intenta nuevamente.", 400);
      }
    }
    
    return jsonError("Error interno del servidor al crear la familia de pieza. Por favor, intenta nuevamente o contacta al soporte técnico.", 500);
  }
}