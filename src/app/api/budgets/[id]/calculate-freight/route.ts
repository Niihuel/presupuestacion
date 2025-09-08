import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("budgets", "update");
  const { id: budgetId } = await params;
  if (!idSchema.safeParse(budgetId).success) return jsonError("Invalid id", 400);
  const { distanceKm, truckLoads, originPlant, destination } = await req.json();
  if (typeof distanceKm !== "number" || typeof truckLoads !== "number") return jsonError("Invalid params", 400);
  const rate = await prisma.freightRate.findFirst({
    where: { kmFrom: { lte: distanceKm }, kmTo: { gte: distanceKm } },
    orderBy: { effectiveDate: "desc" },
  });
  const base = rate ? (distanceKm > 12000 ? rate.rateOver12m : rate.rateUnder12m) : 0;
  const totalCost = base * truckLoads;
  const calc = await prisma.freightCalculation.create({
    data: { budgetId, originPlant, destination, distanceKm, truckLoads, totalCost },
  });
  await writeAuditLog({ action: "calculate", resource: "freight", resourceId: calc.id, detail: `budget:${budgetId}` });
  return jsonOK(calc);
}


