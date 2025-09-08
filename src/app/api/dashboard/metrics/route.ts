import { prisma } from "@/lib/prisma";
import { jsonOK, jsonError } from "@/lib/api";
import { requirePermission } from "@/lib/authz";

export async function GET() {
	try {
		await requirePermission("dashboard", "view");

	const [totalBudgets, accepted, rejected, pending, drafts, pendingTracking, overdueTracking, lastPoly, budgetsForMargin] = await Promise.all([
		prisma.budget.count(),
		prisma.budget.count({ where: { status: "accepted" } }),
		prisma.budget.count({ where: { status: "rejected" } }),
		prisma.budget.count({ where: { status: "pending" } }),
		prisma.budget.count({ where: { isDraft: true } }),
		prisma.projectTracking.count({ where: { status: "pendiente" } }),
		prisma.projectTracking.count({ where: { status: "pendiente", scheduledDate: { lt: new Date() } } }),
		prisma.polynomialFormula.findFirst({ where: { isActive: true }, orderBy: { effectiveDate: "desc" } }),
		prisma.budget.findMany({
			where: {
				isDraft: false,
				finalTotal: { gt: 0 },
			},
			select: {
				finalTotal: true,
				totalMaterials: true,
				totalFreight: true,
				totalAssembly: true,
			},
		}),
	]);

	const margins = budgetsForMargin
		.map(b => {
			const totalCost = (b.totalMaterials ?? 0) + (b.totalFreight ?? 0) + (b.totalAssembly ?? 0);
			if (b.finalTotal && b.finalTotal > 0 && totalCost > 0) {
				return (b.finalTotal - totalCost) / b.finalTotal;
			}
			return null;
		})
		.filter(m => m !== null) as number[];

	const avgMargin = margins.length > 0 ? (margins.reduce((a, b) => a + b, 0) / margins.length) * 100 : 0;

	const monthlyAdjustment = lastPoly ? (((lastPoly.steelCoefficient + lastPoly.laborCoefficient + lastPoly.concreteCoefficient + lastPoly.fuelCoefficient) / 4 - 1) * 100) : 0;
	const lastAdjustmentDate = lastPoly ? lastPoly.effectiveDate.toISOString() : null;

		return jsonOK({ totalBudgets, accepted, rejected, pending, drafts, pendingTracking, overdueTracking, avgMargin, monthlyAdjustment, lastAdjustmentDate });
	} catch (error) {
		console.error("Error in dashboard metrics:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Authentication required", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("Insufficient permissions", 403);
			}
		}
		return jsonError("Internal server error", 500);
	}
}


