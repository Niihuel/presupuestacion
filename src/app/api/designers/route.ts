import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination } from "@/lib/api";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";

const designerSchema = z.object({ name: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional() });

export async function GET(req: Request) {
	await requirePermission("projects", "view");
	const url = new URL(req.url);
	const { skip, take } = parsePagination(url);
	const q = url.searchParams.get("q") ?? undefined;
	const where = q ? { name: { contains: q, mode: "insensitive" } } : undefined;
	const [items, total] = await Promise.all([
		prisma.designer.findMany({ skip, take, where, orderBy: { createdAt: "desc" } }),
		prisma.designer.count({ where }),
	]);
	return jsonOK({ items, total });
}

export async function POST(req: Request) {
	await requirePermission("projects", "create");
	const body = await req.json();
	const parsed = designerSchema.safeParse(body);
	if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
	const created = await prisma.designer.create({ data: parsed.data });
	await writeAuditLog({ action: "create", resource: "designer", resourceId: created.id, detail: created.name });
	return jsonCreated(created);
}


