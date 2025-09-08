import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { plantUpdateSchema } from "@/lib/validations/plants";
import { writeAuditLog } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requirePermission("plants", "view");
		const { id } = await params;
		if (!idSchema.safeParse(id).success) return jsonError("ID inválido", 400);
		const plant = await prisma.plant.findUnique({ where: { id } });
		if (!plant) return jsonError("Planta no encontrada", 404);
		return jsonOK(plant);
	} catch (error) {
		console.error("Error in plant GET:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para ver plantas", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para ver plantas", 403);
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requirePermission("plants", "update");
		const { id } = await params;
		if (!idSchema.safeParse(id).success) return jsonError("ID inválido", 400);
		const body = await req.json();
		const parsed = plantUpdateSchema.safeParse(body);
		if (!parsed.success) return jsonError("Error de validación", 400, parsed.error.flatten());
		const updated = await prisma.plant.update({ where: { id }, data: parsed.data });
		await writeAuditLog({ action: "update", resource: "plant", resourceId: id, detail: updated.name });
		return jsonOK(updated);
	} catch (error) {
		console.error("Error in plant PUT:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para actualizar plantas", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para actualizar plantas", 403);
			}
			// Check for Prisma error
			if ('code' in error && (error as any).code === 'P2025') {
				return jsonError("Planta no encontrada", 404);
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requirePermission("plants", "delete");
		const { id } = await params;
		if (!idSchema.safeParse(id).success) return jsonError("ID inválido", 400);
		const plant = await prisma.plant.findUnique({ where: { id } });
		if (!plant) return jsonError("Planta no encontrada", 404);
		await prisma.plant.delete({ where: { id } });
		await writeAuditLog({ action: "delete", resource: "plant", resourceId: id, detail: plant.name });
		return jsonOK({ ok: true });
	} catch (error) {
		console.error("Error in plant DELETE:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para eliminar plantas", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para eliminar plantas", 403);
			}
			// Check for Prisma error
			if ('code' in error && (error as any).code === 'P2025') {
				return jsonError("Planta no encontrada", 404);
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}


