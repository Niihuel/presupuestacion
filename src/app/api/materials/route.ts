import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination } from "@/lib/api";
import { materialSchema } from "@/lib/validations/materials";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
	try {
		await requirePermission("materials", "view");
		const url = new URL(req.url);
		const { skip, take } = parsePagination(url);
		const q = url.searchParams.get("q")?.trim();
		const category = url.searchParams.get("category");
		
		const where: any = {};
		if (q) where.OR = [
			{ name: { contains: q, mode: "insensitive" } },
			{ code: { contains: q, mode: "insensitive" } }
		];
		if (category) where.category = category;
		
		const [items, total] = await Promise.all([
			prisma.material.findMany({ 
				skip, 
				take, 
				where, 
				orderBy: { name: "asc" },
				include: {
					priceHistory: {
						take: 1,
						orderBy: { effectiveDate: "desc" }
					}
				}
			}),
			prisma.material.count({ where }),
		]);
		
		return jsonOK({ items, total });
	} catch (error) {
		console.error("Error in materials GET:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para ver materiales", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para ver materiales", 403);
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}

export async function POST(req: Request) {
	try {
		await requirePermission("materials", "create");
		const body = await req.json();
		const parsed = materialSchema.safeParse(body);
		
		if (!parsed.success) {
			return jsonError("Error de validación", 400, parsed.error.flatten());
		}
		
		const created = await prisma.material.create({ 
			data: {
				...parsed.data,
				lastPriceUpdate: new Date()
			}
		});
		
		// Crear registro de precio inicial
		await prisma.materialPriceHistory.create({
			data: {
				materialId: created.id,
				price: created.currentPrice,
				changeReason: "Precio inicial",
				effectiveDate: new Date()
			}
		});
		
		await writeAuditLog({ 
			action: "create", 
			resource: "material", 
			resourceId: created.id, 
			detail: created.name 
		});
		
		return jsonCreated(created);
	} catch (error) {
		console.error("Error in materials POST:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para crear materiales", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para crear materiales", 403);
			}
			// Check for unique constraint violation
			if ('code' in error && (error as any).code === 'P2002') {
				return jsonError("Ya existe un material con este código", 409);
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}
