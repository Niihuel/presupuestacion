import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination } from "@/lib/api";
import { projectCreateSchema } from "@/lib/validations/projects";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
	try {
		await requirePermission("projects", "view");
		const url = new URL(req.url);
		const { skip, take } = parsePagination(url);
		const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
		const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc") ?? "desc";
		const q = url.searchParams.get("q")?.trim();
		const allowedSort: Record<string, true> = { name: true, city: true, createdAt: true };
		const orderBy = allowedSort[sortBy] ? { [sortBy]: sortDir } : { createdAt: "desc" };
		const where = q ? { name: { contains: q, mode: "insensitive" } } : undefined;
		const [items, total] = await Promise.all([
			prisma.project.findMany({ skip, take, where, orderBy: orderBy as any }),
			prisma.project.count({ where }),
		]);
		return jsonOK({ items, total });
	} catch (error) {
		console.error("Error in projects GET:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para ver obras", 401, {
					code: "UNAUTHORIZED"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para ver obras", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "projects:view"
				});
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}

export async function POST(req: Request) {
	try {
		// Debug: Get session info for troubleshooting
		const user = await requirePermission("projects", "create");
		console.log(`Project creation authorized for user: ${user.email} (ID: ${user.id})`);
		
		const body = await req.json();
		const parsed = projectCreateSchema.safeParse(body);
		if (!parsed.success) return jsonError("Error de validación", 400, parsed.error.flatten());
		
		const created = await prisma.project.create({ data: parsed.data });
		await writeAuditLog({ action: "create", resource: "project", resourceId: created.id, detail: created.name });
		return jsonCreated(created);
	} catch (error) {
		console.error("Error in projects POST:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para crear obras", 401, {
					code: "UNAUTHORIZED",
					action: "login_required"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para crear obras. Contacta al administrador del sistema.", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "projects:create",
					action: "contact_admin"
				});
			}
			if (error.message === "User has no role assigned") {
				return jsonError("Tu cuenta no tiene un rol asignado. Contacta al administrador del sistema.", 403, {
					code: "NO_ROLE_ASSIGNED",
					action: "contact_admin"
				});
			}
			if (error.message === "User account is not approved") {
				return jsonError("Tu cuenta está pendiente de aprobación. Contacta al administrador del sistema.", 403, {
					code: "ACCOUNT_NOT_APPROVED",
					action: "wait_approval"
				});
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}
