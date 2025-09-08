import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authz";
import { idSchema } from "@/lib/validations/common";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("budgets", "view");
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const budget = await prisma.budget.findUnique({ where: { id }, include: { items: { include: { piece: true } }, additionals: true } });
  if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Presupuesto");
  ws.addRow([`Presupuesto #${budget.id}`, `Versión ${budget.version}`]);
  ws.addRow([]);
  ws.addRow(["Pieza", "Cantidad", "Unitario", "Subtotal"]);
  for (const it of budget.items) {
    ws.addRow([it.piece.description, it.quantity, it.unitPrice ?? 0, it.subtotal ?? (it.quantity * (it.unitPrice ?? 0))]);
  }
  ws.addRow([]);
  ws.addRow(["Adicionales"]);
  ws.addRow(["Descripción", "Cantidad", "Unitario", "Total"]);
  for (const ad of budget.additionals) ws.addRow([ad.description, ad.quantity, ad.unitPrice, ad.total]);

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as any, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename=budget-${budget.id}.xlsx` } });
}


