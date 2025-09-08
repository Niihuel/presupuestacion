import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { userUpdateSchema } from "@/lib/validations/users";
import { writeAuditLog } from "@/lib/audit";

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("users", "update");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	const body = await _req.json();
	const parsed = userUpdateSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const user = await prisma.user.update({ where: { id }, data: parsed.data });
	await writeAuditLog({ action: "update", resource: "user", resourceId: id, detail: user.email });
	return jsonOK(user);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("users", "delete");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	await prisma.user.delete({ where: { id } });
	await writeAuditLog({ action: "delete", resource: "user", resourceId: id });
	return jsonOK({ ok: true });
}


