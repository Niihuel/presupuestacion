import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";

export async function GET(req: Request) {
	try {
		await requirePermission("projects", "view");
		const items = await prisma.projectTracking.findMany({
			orderBy: { scheduledDate: "asc" },
			include: { project: true, budget: true },
		});
		const normalized = items.map((t: any) => ({
			...t,
			reminderDays: parseArray(t.reminderDays),
		}));
		return jsonOK({ items: normalized });
	} catch (error) {
		console.error("Error in tracking events:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Authentication required", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("Insufficient permissions", 403);
			}
		}
		return jsonError("Failed to list tracking events", 500);
	}
}

function parseArray(v: unknown): number[] {
	try { return JSON.parse(String(v ?? "[]")) as number[]; } catch { return []; }
}


