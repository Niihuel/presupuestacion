import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError, jsonCreated } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { observationSchema } from "@/lib/validations/budgets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
	await requirePermission("budgets", "update");
	const budgetId = id;
	if (!idSchema.safeParse(budgetId).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const parsed = observationSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const session = await getServerSession(authOptions);
	if (!session?.user) return jsonError("Unauthorized", 401);
	const created = await prisma.budgetObservation.create({ data: { ...parsed.data, budgetId, createdBy: (session.user as any).id } });
	await writeAuditLog({ action: "create", resource: "budgetObservation", resourceId: created.id, detail: `budget:${budgetId}` });
	return jsonCreated(created);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	await requirePermission("budgets", "view");
	const budgetId = id;
	if (!idSchema.safeParse(budgetId).success) return jsonError("Invalid id", 400);
	const items = await prisma.budgetObservation.findMany({ where: { budgetId }, orderBy: { createdAt: "desc" } });
	return jsonOK(items);
}


