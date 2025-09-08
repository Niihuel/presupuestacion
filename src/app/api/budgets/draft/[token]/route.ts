import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
	await requirePermission("budgets", "view");
	const { token } = await params;
	if (!token) return jsonError("invalid_token", 400);
	const b = await prisma.budget.findFirst({ where: { resumeToken: token, isDraft: true } });
	if (!b) return jsonError("not_found", 404);
	let draftData: any = {};
	try { draftData = b.draftData ? JSON.parse(String(b.draftData)) : {}; } catch { draftData = {}; }
	let completedSteps: number[] = [];
	try { completedSteps = b.completedSteps ? JSON.parse(String(b.completedSteps)) : []; } catch { completedSteps = []; }
	return jsonOK({ id: b.id, draftStep: b.draftStep ?? 1, draftData, completedSteps });
}


