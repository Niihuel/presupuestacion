import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const drafts = await prisma.budget.findMany({
      where: {
        isDraft: true
      },
      include: {
        customer: {
          select: {
            companyName: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        items: true
      },
      orderBy: {
        lastEditedAt: 'desc'
      }
    });

    const formattedDrafts = drafts.map(draft => ({
      id: draft.id,
      name: `Presupuesto #${draft.id.slice(0, 8)}`,
      customerName: draft.customer?.companyName || 'Sin cliente',
      projectName: draft.project?.name,
      status: draft.status.toLowerCase(),
      lastModified: draft.lastEditedAt,
      createdAt: draft.createdAt,
      totalAmount: draft.finalTotal,
      completionPercentage: calculateCompletionPercentage(draft),
      items: draft.items
    }));

    return NextResponse.json(formattedDrafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const draft = await prisma.budget.create({
      data: {
        customerId: body.customerId,
        projectId: body.projectId,
        userId: body.userId || 'default-user-id', // Should come from auth
        status: 'draft',
        isDraft: true,
        draftStep: 1,
        validityDays: 30,
        finalTotal: 0,
        items: {
          create: body.items || []
        }
      },
      include: {
        customer: true,
        project: true,
        items: true
      }
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}

function calculateCompletionPercentage(draft: any): number {
  let completedFields = 0;
  const totalFields = 7;

  if (draft.customerId) completedFields++;
  if (draft.projectId) completedFields++;
  if (draft.description) completedFields++;
  if (draft.items && draft.items.length > 0) completedFields++;
  if (draft.totalAmount > 0) completedFields++;
  if (draft.validUntil) completedFields++;
  if (draft.paymentTerms) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
}
