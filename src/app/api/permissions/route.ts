import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";
import { permissionSchema } from "@/lib/validations/roles";

export async function GET() {
	try {
		// Remove permission check for basic permission listing to avoid recursion
		// This endpoint is used by the frontend to check permissions
		const permissions = await prisma.permission.findMany({
			orderBy: [{ resource: 'asc' }, { action: 'asc' }]
		});
		
		// Group permissions by resource for easier frontend consumption
		const grouped = permissions.reduce((acc, permission) => {
			if (!acc[permission.resource]) {
				acc[permission.resource] = [];
			}
			acc[permission.resource].push(permission);
			return acc;
		}, {} as Record<string, typeof permissions>);
		
		return jsonOK(grouped);
	} catch (error: any) {
		return jsonError("Error interno del servidor", 500);
	}
}

export async function POST(req: Request) {
	try {
		await requirePermission("permissions", "create");
		const body = await req.json();
		const parsed = permissionSchema.safeParse(body);
		if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
		const perm = await prisma.permission.create({ data: parsed.data });
		return jsonCreated(perm);
	} catch (error: any) {
		if (error.message?.includes("Insufficient permissions")) {
			return jsonError("No tienes permisos para crear permisos", 403, {
				code: "INSUFFICIENT_PERMISSIONS",
				requiredPermission: "permissions:create"
			});
		}
		if (error.message === "Unauthorized") {
			return jsonError("Debes iniciar sesión para realizar esta acción", 401, {
				code: "UNAUTHORIZED"
			});
		}
		return jsonError("Error interno del servidor", 500);
	}
}


