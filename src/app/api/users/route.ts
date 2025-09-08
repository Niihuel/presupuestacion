import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonCreated, jsonError, parsePagination } from "@/lib/api";
import { userCreateSchema } from "@/lib/validations/users";
import bcrypt from "bcryptjs";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
	try {
		await requirePermission("users", "view");
		const url = new URL(req.url);
		const { skip, take } = parsePagination(url);
		const [items, total] = await Promise.all([
			prisma.user.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
			prisma.user.count(),
		]);
		return jsonOK({ items, total });
	} catch (error) {
		console.error("Error in users GET:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Authentication required", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("Insufficient permissions", 403);
			}
		}
		return jsonError("Internal server error", 500);
	}
}

export async function POST(req: Request) {
	try {
		await requirePermission("users", "create");
		const body = await req.json();
		const parsed = userCreateSchema.safeParse(body);
		if (!parsed.success) return jsonError("Validation error", 400, parsed.error.flatten());
		const data = parsed.data;
		const exists = await prisma.user.findUnique({ where: { email: data.email } });
		if (exists) return jsonError("Email ya registrado", 409);
		const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;
		const user = await prisma.user.create({ data: { ...data, passwordHash } });
		await writeAuditLog({ action: "create", resource: "user", resourceId: user.id, detail: user.email });
		return jsonCreated(user);
	} catch (error) {
		console.error("Error in users POST:", error);
		if (error instanceof Error) {
			if (error.message === "Unauthorized") {
				return jsonError("Authentication required", 401);
			}
			if (error.message.startsWith("Insufficient permissions")) {
				return jsonError("Insufficient permissions", 403);
			}
		}
		return jsonError("Internal server error", 500);
	}
}


