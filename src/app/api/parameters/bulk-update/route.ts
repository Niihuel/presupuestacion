import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
	await requirePermission("parameters", "update");
	const body = await req.json();
	const percent = Number(body?.percent);
	if (!Number.isFinite(percent)) return jsonError("Invalid percent", 400);
	await prisma.$transaction([
		prisma.materialPrice.updateMany({ data: { price: { multiply: 1 + percent / 100 } } }),
	]);
	await writeAuditLog({ action: "update", resource: "parameters-bulk", detail: `+${percent}%` });
	return jsonOK({ ok: true });
}


