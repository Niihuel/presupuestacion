import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK } from "@/lib/api";

export async function GET(req: Request) {
	await requirePermission("budgets", "view");
	const url = new URL(req.url);
	const step = Number(url.searchParams.get("step") ?? "0") || 0;
	const items = await prisma.budget.findMany({
		where: {
			isDraft: true,
			...(step ? { draftStep: step } : {}),
		},
		orderBy: { lastEditedAt: "desc" },
		include: {
			customer: true,
			project: true,
			_count: { select: { items: true } },
		},
	});
	// completedSteps se guarda como string JSON
	const mapped = items.map((b: any) => ({
		...b,
		completedSteps: safeParseArray(b.completedSteps),
		piecesCount: b._count?.items ?? 0,
	}));
	return jsonOK({ items: mapped });
}

function safeParseArray(v: unknown): number[] {
	try {
		if (!v) return [];
		if (Array.isArray(v)) return v as number[];
		return JSON.parse(String(v ?? "[]")) as number[];
	} catch {
		return [];
	}
}


