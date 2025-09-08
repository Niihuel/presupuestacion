import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { customerUpdateSchema } from "@/lib/validations/customers";
import { writeAuditLog } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("customers", "update");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const parsed = customerUpdateSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const updated = await prisma.customer.update({ where: { id }, data: parsed.data });
	await writeAuditLog({ action: "update", resource: "customer", resourceId: id, detail: updated.companyName });
	return jsonOK(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("customers", "delete");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	await prisma.customer.delete({ where: { id } });
	await writeAuditLog({ action: "delete", resource: "customer", resourceId: id });
	return jsonOK({ ok: true });
}


