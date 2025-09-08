import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { idSchema } from "@/lib/validations/common";
import { writeAuditLog } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("budgets", "view");
  const budgetId = id;
  if (!idSchema.safeParse(budgetId).success) return jsonError("Invalid id", 400);
  const rows = await prisma.budgetTracking.findMany({ where: { budgetId }, orderBy: { changedAt: "desc" } });
  return jsonOK(rows);
}


