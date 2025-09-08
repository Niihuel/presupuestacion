import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requirePermission("projects", "update");
	const { id } = await params;
	const existing = await prisma.projectTracking.findUnique({ where: { id } });
	if (!existing) return jsonError("not_found", 404);
	const updated = await prisma.projectTracking.update({
		where: { id },
		data: { status: "completado", completedDate: new Date() },
	});
	try{ await writeAuditLog({ action: "complete", resource: "project_tracking", resourceId: id }); } catch(_e){}
	return jsonOK(updated);
}


