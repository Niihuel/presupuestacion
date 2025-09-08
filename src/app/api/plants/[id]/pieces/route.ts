import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
	await requirePermission("pieces", "view");
	const plantId = id;
	if (!idSchema.safeParse(plantId).success) return jsonError("Invalid id", 400);
	const pieces = await prisma.piece.findMany({ where: { plantId } });
	return jsonOK(pieces);
}


