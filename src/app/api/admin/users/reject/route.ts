import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";
import { z } from "zod";

const rejectSchema = z.object({
  userId: z.string().min(1, "ID de usuario requerido"),
  reason: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar que el usuario esté autenticado y tenga permisos de admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const data = rejectSchema.parse(body);

    // Buscar el usuario pendiente
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.isApproved) {
      return NextResponse.json(
        { error: "No se puede rechazar un usuario ya aprobado" },
        { status: 400 }
      );
    }

    if (user.provider !== 'manual') {
      return NextResponse.json(
        { error: "Solo se pueden rechazar usuarios de registro manual" },
        { status: 400 }
      );
    }

    // Marcar usuario como rechazado
    const rejectedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        rejectedAt: new Date(),
        rejectionReason: data.reason,
        active: false // Mantener inactivo
      }
    });

    // Enviar email de rechazo al usuario
    try {
      const emailData = emailTemplates.userRejectionNotification({
        firstName: rejectedUser.firstName || 'Usuario',
        email: rejectedUser.email,
        reason: data.reason
      });

      await sendEmail({
        to: rejectedUser.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      console.log('✅ Email de rechazo enviado a:', rejectedUser.email);
    } catch (emailError) {
      console.error('❌ Error enviando email de rechazo:', emailError);
      // No fallar el rechazo por error de email
    }

    return NextResponse.json({
      success: true,
      message: "Usuario rechazado exitosamente",
      user: {
        id: rejectedUser.id,
        email: rejectedUser.email,
        firstName: rejectedUser.firstName,
        lastName: rejectedUser.lastName,
        rejectedAt: rejectedUser.rejectedAt,
        rejectionReason: rejectedUser.rejectionReason
      }
    });

  } catch (error) {
    console.error('Error rejecting user:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
