import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";

export async function GET() {
	try {
		await requirePermission("budgets", "view");
	const items = await prisma.budget.findMany({
		where: { isDraft: true },
		orderBy: { lastEditedAt: "desc" },
		select: { id: true, draftStep: true, resumeToken: true, lastEditedAt: true, customer: { select: { companyName: true } } },
	});
	const summary: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
	for (const b of items) {
		const step = Number(b.draftStep ?? 1);
		// Ensure the step is a valid key in the summary object before pushing
		if (step >= 1 && step <= 6) {
			summary[step].push({ id: b.id, resumeToken: b.resumeToken, lastEditedAt: b.lastEditedAt, customerName: b.customer?.companyName ?? "" });
		}
	}
		return jsonOK(summary);
	} catch (error) {
		console.error("Error in budgets draft summary:", error);
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


