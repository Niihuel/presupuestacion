import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination } from "@/lib/api";
import { customerCreateSchema } from "@/lib/validations/customers";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
	try {
		await requirePermission("customers", "view");
	const url = new URL(req.url);
	const { skip, take } = parsePagination(url);
	const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
	const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc") ?? "desc";
	const q = url.searchParams.get("q")?.trim();
	const allowedSort: Record<string, true> = { displayName: true, city: true, province: true, email: true, createdAt: true };
	const orderBy = (allowedSort as any)[sortBy] ? { [sortBy]: sortDir } : { createdAt: "desc" };
	const where = q
		? {
			OR: [
				{ displayName: { contains: q, mode: "insensitive" } },
				{ email: { contains: q, mode: "insensitive" } },
				{ phone: { contains: q } },
			],
		}
		: undefined;
	const [items, total] = await Promise.all([
		prisma.customer.findMany({ skip, take, where, orderBy: orderBy as any }),
		prisma.customer.count({ where }),
		]);
		return jsonOK({ items, total });
	} catch (error) {
		console.error("Error in customers GET:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para ver clientes", 401, {
					code: "UNAUTHORIZED"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para ver clientes", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "customers:view"
				});
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}

export async function POST(req: Request) {
	try {
		// Debug: Get session info for troubleshooting
		const user = await requirePermission("customers", "create");
		console.log(`Customer creation authorized for user: ${user.email} (ID: ${user.id})`);
		
		const body = await req.json();
		const parsed = customerCreateSchema.safeParse(body);
		if (!parsed.success) return jsonError("Error de validación", 400, parsed.error.flatten());
		
		const created = await prisma.customer.create({ data: parsed.data });
		await writeAuditLog({ action: "create", resource: "customer", resourceId: created.id, detail: created.displayName ?? "" });
		return jsonCreated(created);
	} catch (error) {
		console.error("Error in customers POST:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para crear clientes", 401, {
					code: "UNAUTHORIZED",
					action: "login_required"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para crear clientes. Contacta al administrador del sistema.", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "customers:create",
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


