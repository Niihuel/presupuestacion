import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, getSessionUser } from '@/lib/authz';

export async function GET(request: NextRequest) {
  try {
    await requirePermission("system", "view");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * pageSize;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { detail: { contains: search, mode: 'insensitive' } },
            { resource: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    // Get audit logs with pagination
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Transform to expected format
    const formattedItems = items.map(item => ({
      id: item.id,
      action: item.action,
      event: item.action,
      resource: item.resource,
      resourceId: item.resourceId,
      description: item.detail,
      message: item.detail,
      at: item.createdAt,
      userId: item.userId,
      user: item.user,
    }));

    return NextResponse.json({
      items: formattedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);

    // Handle permission errors gracefully
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver los registros de auditoría' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
