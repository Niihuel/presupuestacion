import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        category: body.category,
        priority: body.priority,
        status: body.status,
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
        client: true,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Error updating calendar event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Error deleting calendar event' },
      { status: 500 }
    );
  }
}
