import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination, handleApiError } from "@/lib/api";
import { moldSchema } from "@/lib/validations/pieces";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
	try {
		await requirePermission("molds", "view");
	const url = new URL(req.url);
	const { skip, take } = parsePagination(url);
	const familyId = url.searchParams.get("familyId");
	const plantId = url.searchParams.get("plantId");
	const active = url.searchParams.get("active");
	
	const where: any = {};
	if (familyId) where.familyId = familyId;
	if (plantId) where.plantId = plantId;
	if (active !== null) where.active = active === "true";
	
	const [items, total] = await Promise.all([
		prisma.mold.findMany({
			skip,
			take,
			where,
			orderBy: { code: "asc" },
			include: {
				family: true,
				plant: true,
				pieces: {
					select: { id: true, description: true }
				}
			}
		}),
		prisma.mold.count({ where })
		]);
		
		return jsonOK({ items, total });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		await requirePermission("molds", "create");
	const body = await req.json();
	const parsed = moldSchema.safeParse(body);
	
	if (!parsed.success) {
		return jsonError("Validation error", 400, parsed.error.flatten());
	}
	
	// Verificar que no exista otro molde con el mismo código
	const existing = await prisma.mold.findFirst({
		where: { 
			code: parsed.data.code,
			familyId: parsed.data.familyId
		}
	});
	
	if (existing) {
		return jsonError("Mold code already exists for this family", 400);
	}
	
	const created = await prisma.mold.create({
		data: {
			...parsed.data,
			active: parsed.data.active ?? true
		},
		include: {
			family: true,
			plant: true
		}
	});
	
	await writeAuditLog({
		action: "create",
		resource: "mold",
		resourceId: created.id,
		detail: `Created mold: ${created.code}`
		});
		
		return jsonCreated(created);
	} catch (error) {
		return handleApiError(error);
	}
}
