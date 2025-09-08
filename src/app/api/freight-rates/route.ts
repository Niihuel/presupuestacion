import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";
import { freightRateSchema } from "@/lib/validations/rates";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
	await requirePermission("parameters", "view");
	const rows = await prisma.freightRate.findMany({ orderBy: { effectiveDate: "desc" } });
	return jsonOK(rows);
}

export async function POST(req: Request) {
	await requirePermission("parameters", "create");
	const body = await req.json();
	const parsed = freightRateSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	
	// Add default origin if not provided
	const createData = {
		...parsed.data,
		origin: body.origin || 'CO' // Default to Córdoba
	};
	
	const created = await prisma.freightRate.create({ data: createData });
	await writeAuditLog({ action: "create", resource: "freightRate", resourceId: created.id });
	return jsonCreated(created);
}


