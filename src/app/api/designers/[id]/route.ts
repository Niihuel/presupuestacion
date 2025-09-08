import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";

const designerSchema = z.object({ name: z.string().min(1).optional(), email: z.string().email().optional(), phone: z.string().optional() });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("projects", "update");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const parsed = designerSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const updated = await prisma.designer.update({ where: { id }, data: parsed.data });
	await writeAuditLog({ action: "update", resource: "designer", resourceId: id, detail: updated.name });
	return jsonOK(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("projects", "delete");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	await prisma.designer.delete({ where: { id } });
	await writeAuditLog({ action: "delete", resource: "designer", resourceId: id });
	return jsonOK({ ok: true });
}


