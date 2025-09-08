import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Back-compat schema used by the wizard UI. This will be mapped to Customer fields.
const clientCreateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  cuit: z.string().min(1, 'CUIT inválido'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    const items = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { displayName: { contains: search } },
              { companyName: { contains: search } },
              { taxId: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      take: limit,
      orderBy: { displayName: 'asc' },
      select: {
        id: true,
        displayName: true,
        companyName: true,
        taxId: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        province: true,
        contactPerson: true,
        createdAt: true,
      },
    });

    // Map to legacy client shape expected by the wizard UI
    const clients = items.map((c) => ({
      id: c.id,
      name: c.displayName ?? c.companyName ?? '',
      cuit: c.taxId ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      city: c.city ?? '',
      province: c.province ?? '',
      contactName: c.contactPerson ?? undefined,
      contactPhone: c.phone ?? undefined,
      contactEmail: c.email ?? undefined,
      createdAt: c.createdAt,
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = clientCreateSchema.parse(body);

    // Verificar si el CUIT (taxId) ya existe en Customer
    const existingCustomer = await prisma.customer.findFirst({
      where: { taxId: data.cuit }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este CUIT' },
        { status: 400 }
      );
    }

    const created = await prisma.customer.create({
      data: {
        // Ensure both displayName and companyName are filled for consistency
        displayName: data.name,
        companyName: data.name,
        taxId: data.cuit,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        province: data.province,
        contactPerson: data.contactName,
      }
    });

    // Return in legacy client shape for the wizard UI
    const client = {
      id: created.id,
      name: created.displayName ?? created.companyName ?? data.name,
      cuit: created.taxId ?? data.cuit,
      email: created.email ?? data.email ?? '',
      phone: created.phone ?? data.phone ?? '',
      address: created.address ?? data.address ?? '',
      city: created.city ?? data.city ?? '',
      province: created.province ?? data.province ?? '',
      contactName: created.contactPerson ?? data.contactName,
      contactPhone: created.phone ?? data.contactPhone,
      contactEmail: created.email ?? data.contactEmail,
      createdAt: created.createdAt,
    };

    return NextResponse.json(client, { status: 201 });

  } catch (error) {
    console.error('Error creating client:', error);
    
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

