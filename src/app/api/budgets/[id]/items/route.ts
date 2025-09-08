import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { budgetItemSchema } from "@/lib/validations/budgets";
import { writeAuditLog } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
	await requirePermission("budgets", "view");
	const budgetId = id;
	if (!idSchema.safeParse(budgetId).success) return jsonError("Invalid id", 400);
	const items = await prisma.budgetItem.findMany({ where: { budgetId } });
	return jsonOK(items);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	await requirePermission("budgets", "update");
	const budgetId = id;
	if (!idSchema.safeParse(budgetId).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const parsed = budgetItemSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const created = await prisma.budgetItem.create({ data: { ...parsed.data, budgetId } });
	await writeAuditLog({ action: "create", resource: "budgetItem", resourceId: created.id, detail: `budget:${budgetId}` });
	return jsonCreated(created);
}


