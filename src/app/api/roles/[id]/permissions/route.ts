import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
	await requirePermission("roles", "view");
	const roleId = id;
	if (!idSchema.safeParse(roleId).success) return jsonError("Invalid id", 400);
	
	const rolePermissions = await prisma.rolePermission.findMany({
		where: { roleId },
		include: { permission: true }
	});
	
	const permissions = rolePermissions.map(rp => rp.permission);
	return jsonOK(permissions);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	await requirePermission("roles", "update");
	const roleId = id;
	if (!idSchema.safeParse(roleId).success) return jsonError("Invalid id", 400);
	const body = await req.json();
	const permissionIds: string[] = Array.isArray(body?.permissionIds) ? body.permissionIds : [];
	
	// Use transaction to ensure atomicity
	await prisma.$transaction(async (tx) => {
		// Remove all existing permissions
		await tx.rolePermission.deleteMany({ where: { roleId } });
		
		// Add new permissions
		if (permissionIds.length > 0) {
			await tx.rolePermission.createMany({ 
				data: permissionIds.map((permissionId) => ({ 
					roleId, 
					permissionId,
					description: `Updated via role management`,
					assignedBy: 'system' // TODO: use actual user ID when available
				})) 
			});
		}
	});
	
	await writeAuditLog({ action: "update", resource: "rolePermissions", resourceId: roleId });
	return jsonOK({ ok: true });
}


