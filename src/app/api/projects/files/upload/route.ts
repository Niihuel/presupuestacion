import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
	await requirePermission("projects", "update");
	const form = await (req as any).formData?.() ?? await req.formData();
	const file = form.get("file") as File | null;
	const projectId = String(form.get("projectId") ?? "");
	const category = String(form.get("category") ?? "documentos");
	if (!file || !projectId) return NextResponse.json({ error: "missing_params" }, { status: 400 });

	// Guardado en disco local (ejemplo); en producción usar S3/Azure/etc.
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const fs = await import("fs");
	const path = await import("path");
	const uploadDir = path.join(process.cwd(), "public", "uploads", projectId);
	fs.mkdirSync(uploadDir, { recursive: true });
	const fileName = `${Date.now()}-${file.name}`;
	const fullPath = path.join(uploadDir, fileName);
	fs.writeFileSync(fullPath, buffer);

	const item = await prisma.projectFile.create({
		data: {
			projectId,
			fileName,
			fileUrl: `/uploads/${projectId}/${fileName}`,
			fileType: file.type || "application/octet-stream",
			category,
			size: file.size,
		},
	});

	try { await writeAuditLog({ action: "upload", resource: "project_file", resourceId: item.id }); } catch {}

	return NextResponse.json(item, { status: 201 });
}


