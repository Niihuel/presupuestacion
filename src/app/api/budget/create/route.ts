import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const budgetCreateSchema = z.object({
  clientId: z.string(),
  projectId: z.string(),
  plantId: z.string(),
  pieces: z.array(z.object({
    pieceId: z.string(),
    quantity: z.number().min(1)
  })),
  distance: z.object({
    constructionLat: z.number(),
    constructionLng: z.number(),
    constructionAddress: z.string(),
    realDistance: z.number(),
    billedDistance: z.number(),
    routePolyline: z.string().optional()
  }),
  freight: z.object({
    totalRealWeight: z.number(),
    totalFalseWeight: z.number(),
    totalFreightCost: z.number(),
    trucksRequired: z.number()
  }),
  additionals: z.object({
    estimatedDays: z.number(),
    totalMontageCost: z.number(),
    totalAdditionalsCost: z.number(),
    complexity: z.enum(['simple', 'medium', 'complex'])
  }),
  summary: z.object({
    baseCost: z.number(),
    margin: z.number(),
    marginAmount: z.number(),
    subtotalWithMargin: z.number(),
    paymentAdjustmentAmount: z.number(),
    tax: z.number(),
    finalTotal: z.number(),
    paymentTerms: z.string(),
    currency: z.string(),
    validityDays: z.number(),
    internalNotes: z.string().optional(),
    clientNotes: z.string().optional()
  }),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'REJECTED']).default('DRAFT'),
  resumeToken: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = budgetCreateSchema.parse(body);

    // Calcular fecha de expiración
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + data.summary.validityDays);

    // Crear el presupuesto en la base de datos
    const budget = await prisma.budget.create({
      data: {
        customerId: data.clientId,
        projectId: data.projectId,
        userId: data.clientId, // Temporal - debe venir del auth
        
        // Mapear a campos del schema existente
        totalMaterials: data.summary.baseCost,
        totalFreight: data.freight.totalFreightCost,
        totalAssembly: data.additionals.totalMontageCost,
        totalAdditionals: data.additionals.totalAdditionalsCost,
        taxes: data.summary.tax,
        finalTotal: data.summary.finalTotal,
        validityDays: data.summary.validityDays,
        notes: data.summary.internalNotes,
        paymentConditions: data.summary.paymentTerms,
        
        status: data.status,
        resumeToken: data.resumeToken,
        
        // Crear items de presupuesto
        items: {
          create: data.pieces.map(piece => ({
            pieceId: piece.pieceId,
            quantity: piece.quantity
          }))
        }
      },
      include: {
        customer: true,
        project: true,
        items: {
          include: {
            piece: true
          }
        }
      }
    });

    return NextResponse.json({
      id: budget.id,
      budgetNumber: `PRES-${budget.id.toString().padStart(6, '0')}`,
      status: budget.status,
      validityDays: budget.validityDays,
      message: 'Presupuesto creado exitosamente'
    });

  } catch (error) {
    console.error('Error creating budget:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
