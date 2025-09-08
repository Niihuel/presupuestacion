import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { projectFileSchema } from "@/lib/validations/projects";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
	await requirePermission("projects", "update");
	const projectId = id;
	if (!idSchema.safeParse(projectId).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const parsed = projectFileSchema.safeParse({ ...body, projectId });
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const file = await prisma.projectFile.create({ data: parsed.data });
	try { await writeAuditLog({ action: "create", resource: "project_file", resourceId: file.id }); } catch {}
	return jsonOK(file);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	await requirePermission("projects", "view");
	const projectId = id;
	if (!idSchema.safeParse(projectId).success) return jsonError("Invalid id", 400);
	const items = await prisma.projectFile.findMany({ where: { projectId }, orderBy: { uploadedAt: "desc" } });
	return jsonOK({ items });
}


