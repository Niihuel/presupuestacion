import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";

export async function GET() {
  try {
    // Verificar permisos para ver eventos del calendario
    await requirePermission("tracking", "view");
    const events = await prisma.calendarEvent.findMany({
      include: {
        budget: {
          include: {
            customer: true,
            project: true,
          },
        },
        project: {
          include: {
            customer: true,
          },
        },
        client: true, // This is the direct relation from CalendarEvent to Customer
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json({
      items: events,
      total: events.length,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Debes iniciar sesión para ver eventos del calendario", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      if (error.message.startsWith("Insufficient permissions")) {
        return NextResponse.json(
          { 
            error: "No tienes permisos para ver eventos del calendario", 
            code: "INSUFFICIENT_PERMISSIONS",
            requiredPermission: "tracking:view"
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

export async function POST(request: NextRequest) {
  try {
    // Verificar permisos para crear eventos del calendario
    await requirePermission("tracking", "create");
    const body = await request.json();
    
    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        category: body.category,
        priority: body.priority || 'media',
        status: body.status || 'pendiente',
        budgetId: body.budgetId,
        projectId: body.projectId,
        clientId: body.clientId,
        daysUntilExpiry: body.daysUntilExpiry,
      },
      include: {
        budget: {
          include: {
            customer: true,
            project: true,
          },
        },
        project: {
          include: {
            customer: true,
          },
        },
        client: true, // This is the direct relation from CalendarEvent to Customer
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Error creating calendar event' },
      { status: 500 }
    );
  }
}
