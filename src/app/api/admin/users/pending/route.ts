import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar que el usuario esté autenticado y tenga permisos de admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // TODO: Implementar verificación de rol de admin cuando esté disponible
    // Por ahora, permitir acceso a cualquier usuario autenticado
    
    const pendingUsers = await prisma.user.findMany({
      where: {
        provider: 'manual',
        isApproved: false,
        active: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        createdAt: true,
        registrationToken: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      users: pendingUsers,
      count: pendingUsers.length
    });

  } catch (error) {
    console.error('Error fetching pending users:', error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
