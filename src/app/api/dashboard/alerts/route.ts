import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("system", "view");
    const alerts = await prisma.systemAlert.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
    return NextResponse.json({ items: alerts });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Debes iniciar sesión para ver alertas", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      if (error.message.startsWith("Insufficient permissions")) {
        return NextResponse.json(
          { 
            error: "No tienes permisos para ver alertas del sistema", 
            code: "INSUFFICIENT_PERMISSIONS",
            requiredPermission: "system:view"
          },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await requirePermission("system", "update");
    // Marcar todas como leídas
    await prisma.systemAlert.updateMany({ where: { read: false }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Debes iniciar sesión para actualizar alertas", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      if (error.message.startsWith("Insufficient permissions")) {
        return NextResponse.json(
          {
            error: "No tienes permisos para actualizar alertas del sistema",
            code: "INSUFFICIENT_PERMISSIONS",
            requiredPermission: "system:update"
          },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}


