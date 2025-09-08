import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email("Email inválido")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = resendSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ 
        message: "Si el email existe y no está verificado, se enviará un enlace de verificación." 
      });
    }

    if (user.isApproved) {
      return NextResponse.json({ 
        message: "Esta cuenta ya está verificada." 
      });
    }

    // Generate new verification token if needed
    let verificationToken = user.registrationToken;
    if (!verificationToken) {
      verificationToken = `REG_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      await prisma.user.update({
        where: { id: user.id },
        data: { registrationToken: verificationToken }
      });
    }

    // Send verification email
    try {
      const emailData = emailTemplates.emailVerification({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        verificationToken
      });

      await sendEmail({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      console.log('✅ Email de verificación reenviado a:', user.email);
    } catch (emailError) {
      console.error('❌ Error enviando email de verificación:', emailError);
      return NextResponse.json({ 
        error: "Error enviando el email de verificación" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Si el email existe y no está verificado, se enviará un enlace de verificación." 
    });

  } catch (error) {
    console.error('Error in resend verification:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Email inválido", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}