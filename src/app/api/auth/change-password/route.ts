import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Solo usuarios con credenciales locales pueden cambiar contraseña
    if (user.provider !== 'credentials') {
      return NextResponse.json(
        { message: 'Los usuarios de Google no pueden cambiar contraseña desde aquí' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'La contraseña actual y nueva son requeridas' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Obtener usuario con contraseña
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || !dbUser.passwordHash) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, dbUser.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { message: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 }
      );
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedNewPassword,
      },
    });

    // Registrar login exitoso para auditar el cambio
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        success: true,
        ipAddress: null,
      },
    });

    return NextResponse.json({
      message: 'Contraseña actualizada correctamente',
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
