import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("budgets", "update");
  const { id: budgetId } = await params;
  if (!idSchema.safeParse(budgetId).success) return jsonError("Invalid id", 400);
  
  const { distanceKm, totalTons, assemblyDays, craneDays } = await req.json();
  
  // Validate required parameters
  if (typeof distanceKm !== "number" || typeof totalTons !== "number") {
    return jsonError("Invalid distance or tonnage", 400);
  }
  
  // Get assembly rate based on distance and tonnage
  const rate = await prisma.assemblyRate.findFirst({
    where: { kmFrom: { lte: distanceKm }, kmTo: { gte: distanceKm } },
  });
  
  let baseCost = 0;
  if (rate) {
    if (totalTons < 100) baseCost = rate.rateUnder100t;
    else if (totalTons <= 300) baseCost = rate.rate100_300t;
    else baseCost = rate.rateOver300t;
  }
  
  // Calculate additional costs for assembly and crane days
  const assemblyDaysCost = (assemblyDays || 0) * 45000; // Base daily assembly rate
  const craneDaysCost = (craneDays || 0) * 60000; // Base daily crane rate
  
  const totalCost = baseCost + assemblyDaysCost + craneDaysCost;
  
  await writeAuditLog({ 
    action: "calculate", 
    resource: "assembly", 
    resourceId: budgetId, 
    detail: `${distanceKm}km/${totalTons}t, Assembly: ${assemblyDays || 0}d, Crane: ${craneDays || 0}d`
  });
  
  return jsonOK({ 
    baseCost,
    assemblyDaysCost,
    craneDaysCost,
    totalCost,
    breakdown: {
      base: baseCost,
      assemblyDays: assemblyDays || 0,
      assemblyDaysCost,
      craneDays: craneDays || 0,
      craneDaysCost
    }
  });
}


