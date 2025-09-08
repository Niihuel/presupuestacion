import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { projectUpdateSchema } from "@/lib/validations/projects";
import { writeAuditLog } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requirePermission("projects", "update");
		const { id } = await params;
		if (!idSchema.safeParse(id).success) return jsonError("ID inválido", 400);
		const body = await req.json();
		const parsed = projectUpdateSchema.safeParse(body);
		if (!parsed.success) return jsonError("Error de validación", 400, parsed.error.flatten());
		const updated = await prisma.project.update({ where: { id }, data: parsed.data });
		await writeAuditLog({ action: "update", resource: "project", resourceId: id, detail: updated.name });
		return jsonOK(updated);
	} catch (error) {
		console.error("Error in project PUT:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para editar obras", 401, {
					code: "UNAUTHORIZED"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para editar obras", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "projects:update"
				});
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requirePermission("projects", "delete");
		const { id } = await params;
		if (!idSchema.safeParse(id).success) return jsonError("ID inválido", 400);
		await prisma.project.delete({ where: { id } });
		await writeAuditLog({ action: "delete", resource: "project", resourceId: id });
		return jsonOK({ ok: true });
	} catch (error) {
		console.error("Error in project DELETE:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para eliminar obras", 401, {
					code: "UNAUTHORIZED"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para eliminar obras", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "projects:delete"
				});
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}
