import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("customers", "view");
	const { id } = await params;
	if (!idSchema.safeParse(id).success) return jsonError("Invalid id", 400);
	const projects = await prisma.project.findMany({ where: { customerId: id }, orderBy: { createdAt: "desc" } });
	return jsonOK(projects);
}


