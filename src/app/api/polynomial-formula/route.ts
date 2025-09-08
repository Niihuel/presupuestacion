import { prisma } from "@/lib/prisma";
import { requirePermission, getSessionUser } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";
import { polynomialSchema } from "@/lib/validations/rates";

export async function GET() {
  try {
    // Try to get the user session
    const user = await getSessionUser();
    
    // If user exists, check permissions
    if (user) {
      await requirePermission("parameters", "view");
    }
    
    // Fetch polynomial formulas
    const rows = await prisma.polynomialFormula.findMany({ 
      orderBy: [{ createdAt: "desc" }] 
    });
    
    // If no formulas exist, return empty array
    if (!rows || rows.length === 0) {
      return jsonOK([]);
    }
    
    return jsonOK(rows);
  } catch (error: any) {
    console.error("Error in polynomial formula GET:", error);
    // Return empty array instead of error to prevent XML parsing issues
    return jsonOK([]);
  }
}

export async function POST(req: Request) {
  try {
    await requirePermission("parameters", "create");
    const body = await req.json();
    const parsed = polynomialSchema.safeParse(body);
    if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
    
    const created = await prisma.polynomialFormula.create({ data: parsed.data });
    return jsonCreated(created);
  } catch (error: any) {
    console.error("Error in polynomial formula POST:", error);
    return jsonError("Failed to create polynomial formula: " + error.message, 500);
  }
}

export async function PUT(req: Request) {
  try {
    await requirePermission("parameters", "update");
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) return jsonError("ID is required", 400);
    
    const parsed = polynomialSchema.safeParse(updateData);
    if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
    
    const updated = await prisma.polynomialFormula.update({
      where: { id },
      data: parsed.data
    });
    
    return jsonOK(updated);
  } catch (error: any) {
    console.error("Error in polynomial formula PUT:", error);
    return jsonError("Failed to update polynomial formula: " + error.message, 500);
  }
}