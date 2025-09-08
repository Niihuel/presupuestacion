import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination } from "@/lib/api";
import { pieceRecipeSchema } from "@/lib/validations/materials";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
	await requirePermission("pieces", "view");
	const url = new URL(req.url);
	const { skip, take } = parsePagination(url);
	const pieceId = url.searchParams.get("pieceId");
	const familyId = url.searchParams.get("familyId");
	const active = url.searchParams.get("active");
	
	const where: any = {};
	if (pieceId) where.pieceId = pieceId;
	if (familyId) where.familyId = familyId;
	if (active !== null) where.active = active === "true";
	
	const [items, total] = await Promise.all([
		prisma.pieceRecipe.findMany({
			skip,
			take,
			where,
			orderBy: [
				{ piece: { description: "asc" } },
				{ version: "desc" }
			],
			include: {
				piece: true,
				family: true,
				recipeDetails: {
					include: {
						material: true
					}
				}
			}
		}),
		prisma.pieceRecipe.count({ where })
	]);
	
	// Calcular costo total de cada receta
	const itemsWithCost = items.map((recipe: any) => {
		const materialCost = recipe.recipeDetails?.reduce((sum: number, detail: any) => {
			return sum + (detail.quantity * detail.material.currentPrice);
		}, 0) || 0;
		
		return {
			...recipe,
			totalMaterialCost: materialCost
		};
	});
	
	return jsonOK({ items: itemsWithCost, total });
}

export async function POST(req: Request) {
	await requirePermission("pieces", "create");
	const body = await req.json();
	const { details, ...recipeData } = body;
	
	const parsed = pieceRecipeSchema.safeParse(recipeData);
	
	if (!parsed.success) {
		return jsonError("Validation error", 400, parsed.error.flatten());
	}
	
	// Obtener la versión más alta actual
	const lastVersion = await prisma.pieceRecipe.findFirst({
		where: { pieceId: parsed.data.pieceId },
		orderBy: { version: "desc" },
		select: { version: true }
	});
	
	const newVersion = (lastVersion?.version || 0) + 1;
	
	// Crear receta con detalles
	const created = await prisma.pieceRecipe.create({
		data: {
			...parsed.data,
			version: newVersion,
			active: true,
			recipeDetails: details ? {
				create: details.map((detail: any) => ({
					materialId: detail.materialId,
					quantity: detail.quantity,
					unit: detail.unit,
					isOptional: detail.isOptional || false,
					notes: detail.notes
				}))
			} : undefined
		},
		include: {
			piece: true,
			family: true,
			recipeDetails: {
				include: {
					material: true
				}
			}
		}
	});
	
	// Desactivar versiones anteriores si se especifica
	if (body.deactivatePrevious) {
		await prisma.pieceRecipe.updateMany({
			where: {
				pieceId: parsed.data.pieceId,
				id: { not: created.id }
			},
			data: { active: false }
		});
	}
	
	await writeAuditLog({
		action: "create",
		resource: "piece_recipe",
		resourceId: created.id,
		detail: `Created recipe v${newVersion} for piece ${created.piece?.description || 'Unknown'}`
	});
	
	return jsonCreated(created);
}
