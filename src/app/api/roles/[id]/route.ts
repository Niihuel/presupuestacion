import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { roleSchema } from "@/lib/validations/roles";
import { writeAuditLog } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("roles", "update");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const parsed = roleSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const role = await prisma.role.update({ where: { id }, data: parsed.data });
	await writeAuditLog({ action: "update", resource: "role", resourceId: id, detail: role.name });
	return jsonOK(role);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("roles", "delete");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	await prisma.role.delete({ where: { id } });
	await writeAuditLog({ action: "delete", resource: "role", resourceId: id });
	return jsonOK({ ok: true });
}


