import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";
import { materialPriceSchema } from "@/lib/validations/rates";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
	await requirePermission("parameters", "view");
	const rows = await prisma.materialPrice.findMany({ orderBy: { effectiveDate: "desc" } });
	return jsonOK(rows);
}

export async function POST(req: Request) {
	await requirePermission("parameters", "create");
	const body = await req.json();
	const parsed = materialPriceSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const created = await prisma.materialPrice.create({ data: parsed.data });
	await writeAuditLog({ action: "create", resource: "materialPrice", resourceId: created.id, detail: created.materialType });
	return jsonCreated(created);
}


