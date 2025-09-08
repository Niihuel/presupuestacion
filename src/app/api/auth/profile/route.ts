import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, department, position } = body;

    // Actualizar información del usuario
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        phone,
        department,
        position,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        position: true,
        provider: true,
        active: true,
        isApproved: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
