import { prisma } from "@/lib/prisma";
import { jsonOK, jsonError } from "@/lib/api";
import { requirePermission } from "@/lib/authz";

export async function GET() {
	try {
		await requirePermission("reports", "view");
		const now = new Date();
		const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
		const [curr, prev] = await Promise.all([
			prisma.budget.count({ where: { createdAt: { gte: thisMonthStart } } }),
			prisma.budget.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
		]);
		const variation = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
		return jsonOK({ currentMonth: curr, previousMonth: prev, variation });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para ver reportes", 401, {
					code: "UNAUTHORIZED"
				});
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para ver reportes", 403, {
					code: "INSUFFICIENT_PERMISSIONS",
					requiredPermission: "reports:view"
				});
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}


