import { prisma } from "@/lib/prisma";
import { jsonOK, jsonError } from "@/lib/api";
import { requirePermission } from "@/lib/authz";

export async function GET() {
	try {
		await requirePermission("reports", "view");
		const rows = await prisma.materialPrice.findMany({ orderBy: { effectiveDate: "asc" } });
		return jsonOK(rows);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para ver reportes de precios", 401, {
					code: "UNAUTHORIZED"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para ver reportes de precios", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "reports:view"
				});
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}


