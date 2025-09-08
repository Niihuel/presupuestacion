import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, handleApiError } from "@/lib/api";
import { roleSchema } from "@/lib/validations/roles";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
	try {
		await requirePermission("roles", "view");
		const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
		return jsonOK(roles);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		await requirePermission("roles", "create");
		const body = await req.json();
		const parsed = roleSchema.safeParse(body);
		if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
		const role = await prisma.role.create({ data: parsed.data });
		await writeAuditLog({ action: "create", resource: "role", resourceId: role.id, detail: role.name });
		return jsonCreated(role);
	} catch (error) {
		return handleApiError(error);
	}
}


