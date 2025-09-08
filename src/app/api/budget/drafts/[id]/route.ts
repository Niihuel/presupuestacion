import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const draft = await prisma.budget.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        items: true
      }
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    
    // Calculate totals if items are provided
    let subTotal = 0;
    if (body.items) {
      subTotal = body.items.reduce((acc: number, item: any) => {
        return acc + (item.quantity * item.unitPrice);
      }, 0);
    }
    
    const tax = body.tax || (subTotal * 0.21); // 21% IVA default
    const discount = body.discount || 0;
    const totalAmount = subTotal + tax - discount;

    const draft = await prisma.budget.update({
      where: { id },
      data: {
        customerId: body.customerId,
        projectId: body.projectId,
        status: body.status || 'draft',
        isDraft: body.status !== 'finalized',
        draftStep: body.draftStep || 1,
        finalTotal: totalAmount || body.totalAmount || 0,
        validityDays: body.validityDays,
        paymentConditions: body.paymentConditions,
        notes: body.notes,
        // Update items if provided
        ...(body.items && {
          items: {
            deleteMany: {},
            create: body.items.map((item: any) => ({
              pieceId: item.pieceId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice
            }))
          }
        })
      },
      include: {
        customer: true,
        project: true,
        items: true
      }
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.budget.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
