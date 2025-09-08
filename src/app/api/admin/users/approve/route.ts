import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";
import { z } from "zod";

const approveSchema = z.object({
  userId: z.string().min(1, "ID de usuario requerido"),
  registrationToken: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar que el usuario esté autenticado y tenga permisos de admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const data = approveSchema.parse(body);

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
        { error: "El usuario ya está aprobado" },
        { status: 400 }
      );
    }

    if (user.provider !== 'manual') {
      return NextResponse.json(
        { error: "Solo se pueden aprobar usuarios de registro manual" },
        { status: 400 }
      );
    }

    // Obtener información del admin que aprueba
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Aprobar el usuario
    const approvedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        isApproved: true,
        active: true,
        approvedAt: new Date(),
        approvedBy: adminUser?.id
      }
    });

    // Enviar email de confirmación al usuario aprobado
    try {
      const emailData = emailTemplates.userApprovalConfirmation({
        firstName: approvedUser.firstName || 'Usuario',
        email: approvedUser.email
      });

      await sendEmail({
        to: approvedUser.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      console.log('✅ Email de aprobación enviado a:', approvedUser.email);
    } catch (emailError) {
      console.error('❌ Error enviando email de aprobación:', emailError);
      // No fallar la aprobación por error de email
    }

    return NextResponse.json({
      success: true,
      message: "Usuario aprobado exitosamente",
      user: {
        id: approvedUser.id,
        email: approvedUser.email,
        firstName: approvedUser.firstName,
        lastName: approvedUser.lastName,
        approvedAt: approvedUser.approvedAt
      }
    });

  } catch (error) {
    console.error('Error approving user:', error);
    
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
