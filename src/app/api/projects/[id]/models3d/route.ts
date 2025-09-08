import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { projectModel3DSchema } from "@/lib/validations/projects";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
	await requirePermission("projects", "update");
	const projectId = id;
	if (!idSchema.safeParse(projectId).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const parsed = projectModel3DSchema.safeParse({ ...body, projectId });
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const model = await prisma.projectModel3D.create({ data: parsed.data });
	return jsonOK(model);
}


