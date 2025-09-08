import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    // Find user by registration token
    const user = await prisma.user.findFirst({
      where: { registrationToken: token }
    });

    if (!user) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 404 });
    }

    if (user.isApproved) {
      return NextResponse.json({ message: "La cuenta ya está verificada" }, { status: 200 });
    }

    // Approve and activate the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isApproved: true,
        active: true,
        approvedAt: new Date(),
        registrationToken: null // Clear the token after use
      }
    });

    // Redirect to login with success message
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("verified", "true");
    
    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error("Error in email verification:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}