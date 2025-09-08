import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { parameterHistorySchema } from "@/lib/validations/rates";

export async function GET(request: Request) {
	await requirePermission("parameters", "view");
	
	const { searchParams } = new URL(request.url);
	const parameterId = searchParams.get("parameterId");
	
	if (!parameterId) {
		return jsonError("parameterId is required", 400);
	}
	
	const history = await prisma.parameterHistory.findMany({
		where: { parameterId },
		orderBy: { effectiveDate: "desc" }
	});
	
	return jsonOK(history);
}

export async function POST(request: Request) {
	await requirePermission("parameters", "create");
	
	const body = await request.json();
	const parsed = parameterHistorySchema.safeParse(body);
	
	if (!parsed.success) {
		return jsonError("Validation error", 400, parsed.error.flatten());
	}
	
	const history = await prisma.parameterHistory.create({
		data: parsed.data
	});
	
	return jsonOK(history);
}


