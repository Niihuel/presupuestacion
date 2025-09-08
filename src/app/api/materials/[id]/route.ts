import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { materialSchema } from "@/lib/validations/materials";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requirePermission("materials", "view");
		const { id } = await params;
		
		const material = await prisma.material.findUnique({
			where: { id },
			include: {
				priceHistory: {
					orderBy: { effectiveDate: "desc" },
					take: 10
				}
			}
		});
		
		if (!material) return jsonError("Material no encontrado", 404);
		return jsonOK(material);
	} catch (error) {
		console.error("Error in material GET:", error);
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requirePermission("materials", "update");
		const { id } = await params;
		const body = await req.json();
		const parsed = materialSchema.partial().safeParse(body);
		
		if (!parsed.success) {
			return jsonError("Error de validación", 400, parsed.error.flatten());
		}
		
		const current = await prisma.material.findUnique({
			where: { id }
		});
		
		if (!current) return jsonError("Material no encontrado", 404);
		
		// Si el precio cambió, crear registro en histórico
		if (parsed.data.currentPrice && parsed.data.currentPrice !== current.currentPrice) {
			const changePercent = ((parsed.data.currentPrice - current.currentPrice) / current.currentPrice) * 100;
			
			await prisma.materialPriceHistory.create({
				data: {
					materialId: id,
					price: parsed.data.currentPrice,
					changeReason: body.changeReason || "Actualización de precio",
					changePercent,
					effectiveDate: new Date()
				}
			});
		}
		
		const updated = await prisma.material.update({
			where: { id },
			data: {
				...parsed.data,
				lastPriceUpdate: parsed.data.currentPrice ? new Date() : undefined
			}
		});
		
		await writeAuditLog({
			action: "update",
			resource: "material",
			resourceId: id,
			detail: `Material actualizado: ${updated.name}`
		});
		
		return jsonOK(updated);
	} catch (error) {
		console.error("Error in material PATCH:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para actualizar materiales", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para actualizar materiales", 403);
			}
			// Check for Prisma error
			if ('code' in error && (error as any).code === 'P2025') {
				return jsonError("Material no encontrado", 404);
			}
			if ('code' in error && (error as any).code === 'P2002') {
				return jsonError("Ya existe un material con este código", 409);
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requirePermission("materials", "delete");
		const { id } = await params;
		
		// Verificar si el material está en uso en cualquier tabla
		const [recipeCount, materialCount, formulaCount] = await Promise.all([
			prisma.pieceRecipeDetail.count({
				where: { materialId: id }
			}),
			prisma.pieceMaterial.count({
				where: { materialId: id }
			}),
			prisma.pieceFormula.count({
				where: { materialId: id }
			})
		]);
		
		const totalUsage = recipeCount + materialCount + formulaCount;
		
		if (totalUsage > 0) {
			const usageDetails = [];
			if (recipeCount > 0) usageDetails.push(`${recipeCount} receta(s)`);
			if (materialCount > 0) usageDetails.push(`${materialCount} material(es) de pieza`);
			if (formulaCount > 0) usageDetails.push(`${formulaCount} fórmula(s) BOM`);
			
			return jsonError(`No se puede eliminar el material porque está siendo usado en: ${usageDetails.join(', ')}`, 400);
		}
		
		// Eliminar en transacción para garantizar consistencia
		const material = await prisma.$transaction(async (tx) => {
			// Primero eliminar el historial de precios
			await tx.materialPriceHistory.deleteMany({
				where: { materialId: id }
			});
			
			// Luego eliminar el material
			return await tx.material.delete({
				where: { id }
			});
		});
		
		await writeAuditLog({
			action: "delete",
			resource: "material",
			resourceId: id,
			detail: material.name
		});
		
		return jsonOK({ message: "Material eliminado correctamente" });
	} catch (error) {
		console.error("Error in material DELETE:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Debes iniciar sesión para eliminar materiales", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("No tienes permisos para eliminar materiales", 403);
			}
			// Check for Prisma error
			if ('code' in error && (error as any).code === 'P2025') {
				return jsonError("Material no encontrado", 404);
			}
			if ('code' in error && (error as any).code === 'P2014') {
				return jsonError("No se puede eliminar el material porque está siendo usado en otras tablas del sistema", 400);
			}
		}
		return jsonError("Error interno del servidor", 500);
	}
}
