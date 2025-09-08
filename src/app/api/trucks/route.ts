import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination, handleApiError } from "@/lib/api";
import { truckSchema } from "@/lib/validations/trucks";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
	try {
		await requirePermission("trucks", "view");
		const url = new URL(req.url);
		const { skip, take } = parsePagination(url);
		const q = url.searchParams.get("q")?.trim();
		const truckType = url.searchParams.get("truckType");
		const active = url.searchParams.get("active") === "true" ? true : url.searchParams.get("active") === "false" ? false : undefined;

		// Build query conditions
		const where: any = {};
		if (q) {
			where.OR = [
				{ plate: { contains: q, mode: "insensitive" } },
				{ brand: { contains: q, mode: "insensitive" } },
				{ model: { contains: q, mode: "insensitive" } },
				{ description: { contains: q, mode: "insensitive" } }
			];
		}
		if (truckType) where.truckType = truckType;
		if (active !== undefined) where.active = active;

		const [items, total] = await Promise.all([
			prisma.truck.findMany({ 
				skip, 
				take, 
				where,
				include: {
					company: {
						select: {
							id: true,
							name: true
						}
					}
				},
				orderBy: { plate: "asc" } 
			}),
			prisma.truck.count({ where }),
		]);
		return jsonOK({ items, total });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		await requirePermission("trucks", "create");
		const body = await req.json();
		const parsed = truckSchema.safeParse(body);
		if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
		
		// Convert numeric string values to numbers
		const data = {
			...parsed.data,
			capacityTons: parsed.data.capacityTons ? Number(parsed.data.capacityTons) : undefined,
			maxLength: parsed.data.maxLength ? Number(parsed.data.maxLength) : undefined,
			maxPieces: parsed.data.maxPieces ? Number(parsed.data.maxPieces) : undefined,
			minBillableTons: parsed.data.minBillableTons ? Number(parsed.data.minBillableTons) : undefined,
		};

		const created = await prisma.truck.create({ data });
		await writeAuditLog({ action: "create", resource: "truck", resourceId: created.id, detail: created.plate });
		return jsonCreated(created);
	} catch (error) {
		return handleApiError(error);
	}
}


