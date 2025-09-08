import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";
import { assemblyRateSchema } from "@/lib/validations/rates";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
	await requirePermission("parameters", "view");
	const rows = await prisma.assemblyRate.findMany();
	return jsonOK(rows);
}

export async function POST(req: Request) {
	await requirePermission("parameters", "create");
	const body = await req.json();
	const parsed = assemblyRateSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const created = await prisma.assemblyRate.create({ data: parsed.data });
	await writeAuditLog({ action: "create", resource: "assemblyRate", resourceId: created.id });
	return jsonCreated(created);
}


