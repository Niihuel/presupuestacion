import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { polynomialSchema } from "@/lib/validations/rates";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await requirePermission("parameters", "view");
  
  const formula = await prisma.polynomialFormula.findUnique({
    where: { id }
  });
  
  if (!formula) return jsonError("Formula not found", 404);
  
  return jsonOK(formula);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await requirePermission("parameters", "update");
  
  const body = await req.json();
  const { ...updateData } = body;
  
  if (!id) return jsonError("ID is required", 400);
  
  const parsed = polynomialSchema.safeParse(updateData);
  if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
  
  const updated = await prisma.polynomialFormula.update({
    where: { id },
    data: parsed.data
  });
  
  return jsonOK(updated);
}