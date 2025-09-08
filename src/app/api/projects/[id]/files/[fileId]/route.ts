import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
	await requirePermission("projects", "update");
	const { id: projectId, fileId } = await params;
	if (!idSchema.safeParse(projectId).success || !idSchema.safeParse(fileId).success) return jsonError("Invalid id", 400);
	await prisma.projectFile.delete({ where: { id: fileId } });
	return jsonOK({ ok: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
	await requirePermission("projects", "view");
	const { id: projectId, fileId } = await params;
	if (!idSchema.safeParse(projectId).success || !idSchema.safeParse(fileId).success) return jsonError("Invalid id", 400);
	const file = await prisma.projectFile.findUnique({ where: { id: fileId } });
	return jsonOK(file);
}


