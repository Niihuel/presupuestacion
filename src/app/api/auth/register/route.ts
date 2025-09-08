import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "Apellido debe tener al menos 2 caracteres"), 
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ 
      where: { email: data.email } 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" }, 
        { status: 409 }
      );
    }

    // Generar token de registro único
    const registrationToken = `REG_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Crear usuario pendiente de aprobación
    const newUser = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        phone: data.phone,
        department: data.department,
        position: data.position,
        provider: 'manual',
        isApproved: false,
        active: false, // Inactivo hasta aprobación
        registrationToken
      }
    });

    // Enviar email de notificación al equipo de sistemas
    try {
      const emailData = emailTemplates.adminApprovalNotification({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        department: data.department,
        position: data.position,
        registrationToken
      });

      await sendEmail({
        to: 'sistemas@pretensa.com.ar',
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      console.log('✅ Email de notificación enviado a sistemas@pretensa.com.ar');
    } catch (emailError) {
      console.error('❌ Error enviando email de notificación:', emailError);
      // No fallar el registro por error de email, pero loguear
    }

    return NextResponse.json({
      success: true,
      message: "Registro exitoso. Tu cuenta está pendiente de aprobación por el equipo de sistemas. Recibirás un email cuando sea aprobada.",
      userId: newUser.id,
      registrationToken
    });

  } catch (error) {
    console.error('Error in user registration:', error);
    
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


