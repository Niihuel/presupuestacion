import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";
import { parameterSchema } from "@/lib/validations/rates";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
	await requirePermission("parameters", "view");
	const params = await prisma.parameter.findMany({ orderBy: { effectiveDate: "desc" } });
	return jsonOK(params);
}

export async function POST(req: Request) {
	await requirePermission("parameters", "create");
	const body = await req.json();
	const parsed = parameterSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const created = await prisma.parameter.create({ data: parsed.data });
	await writeAuditLog({ action: "create", resource: "parameter", resourceId: created.id, detail: created.name });
	return jsonCreated(created);
}

export async function PUT(req: Request) {
	await requirePermission("parameters", "update");
	const body = await req.json();
	const { id, ...updateData } = body;
	
	if (!id) return jsonError("ID is required", 400);
	
	const parsed = parameterSchema.omit({ effectiveDate: true }).safeParse(updateData);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	
	// Get the current parameter before updating
	const currentParameter = await prisma.parameter.findUnique({
		where: { id }
	});
	
	if (!currentParameter) return jsonError("Parameter not found", 404);
	
	// Create history record before updating
	await prisma.parameterHistory.create({
		data: {
			parameterId: id,
			value: currentParameter.value,
			effectiveDate: currentParameter.effectiveDate,
		}
	});
	
	// Update the parameter
	const updated = await prisma.parameter.update({
		where: { id },
		data: {
			...parsed.data,
			effectiveDate: new Date() // Set new effective date
		}
	});
	
	await writeAuditLog({ action: "update", resource: "parameter", resourceId: id, detail: updated.name });
	return jsonOK(updated);
}

// Add the missing GET endpoint for parameter history by ID
export async function GET_BY_ID(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	await requirePermission("parameters", "view");
	
	const parameter = await prisma.parameter.findUnique({
		where: { id }
	});
	
	if (!parameter) return jsonError("Parameter not found", 404);
	
	return jsonOK(parameter);
}
