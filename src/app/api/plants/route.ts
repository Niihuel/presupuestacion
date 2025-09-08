import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination } from "@/lib/api";
import { plantCreateSchema } from "@/lib/validations/plants";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
	try {
		await requirePermission("plants", "view");
		const url = new URL(req.url);
		const { skip, take } = parsePagination(url);
		const sortBy = url.searchParams.get("sortBy") ?? "name";
		const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc") ?? "asc";
		const q = url.searchParams.get("q")?.trim();
		const allowedSort: Record<string, true> = { name: true, location: true };
		const orderBy = allowedSort[sortBy] ? { [sortBy]: sortDir } : { name: "asc" };
		const where = q ? { 
			OR: [
				{ name: { contains: q, mode: "insensitive" } }, 
				{ location: { contains: q, mode: "insensitive" } }
			] 
		} : undefined;
		const [items, total] = await Promise.all([
			prisma.plant.findMany({ skip, take, where, orderBy: orderBy as any }),
			prisma.plant.count({ where }),
		]);
		return jsonOK({ items, total });
	} catch (error) {
		console.error("Error in plants GET:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para ver plantas", 401, {
					code: "UNAUTHORIZED"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para ver plantas", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "plants:view"
				});
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}

export async function POST(req: Request) {
	try {
		// Debug: Get session info for troubleshooting
		const user = await requirePermission("plants", "create");
		console.log(`Plant creation authorized for user: ${user.email} (ID: ${user.id})`);
		
		const body = await req.json();
		const parsed = plantCreateSchema.safeParse(body);
		if (!parsed.success) return jsonError("Error de validación", 400, parsed.error.flatten());
		
		const created = await prisma.plant.create({ data: parsed.data });
		await writeAuditLog({ action: "create", resource: "plant", resourceId: created.id, detail: created.name });
		return jsonCreated(created);
	} catch (error) {
		console.error("Error in plants POST:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para crear plantas", 401, {
					code: "UNAUTHORIZED",
					action: "login_required"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para crear plantas. Contacta al administrador del sistema.", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "plants:create",
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


