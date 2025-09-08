import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { budgetItemSchema } from "@/lib/validations/budgets";
import { writeAuditLog } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
	await requirePermission("budgets", "update");
	const { itemId } = await params;
	if (!idSchema.safeParse(itemId).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const parsed = budgetItemSchema.partial().safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const updated = await prisma.budgetItem.update({ where: { id: itemId }, data: parsed.data });
	await writeAuditLog({ action: "update", resource: "budgetItem", resourceId: itemId });
	return jsonOK(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
	await requirePermission("budgets", "update");
	const { itemId } = await params;
	if (!idSchema.safeParse(itemId).success) return jsonError("Invalid id", 400);
	await prisma.budgetItem.delete({ where: { id: itemId } });
	await writeAuditLog({ action: "delete", resource: "budgetItem", resourceId: itemId });
	return jsonOK({ ok: true });
}


