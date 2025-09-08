import { NextResponse } from "next/server";

export function jsonOK(data: unknown, init?: ResponseInit) {
	return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated(data: unknown) {
	return NextResponse.json(data, { status: 201 });
}

export function jsonError(message: string, status = 400, details?: unknown) {
	return NextResponse.json({ error: message, details }, { status });
}

export function parsePagination(url: URL) {
	const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
	const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20") || 20));
	const skip = (page - 1) * pageSize;
	return { page, pageSize, skip, take: pageSize };
}

export function handleApiError(error: unknown): NextResponse {
	console.error("API Error:", error);
	if (error instanceof Error) {
		if (error.message === "Unauthorized") {
			return jsonError("Authentication required", 401);
		}
		if (error.message.startsWith("Insufficient permissions")) {
			return jsonError("Insufficient permissions", 403);
		}
		if (error.message.includes("not found")) {
			return jsonError("Resource not found", 404);
		}
	}
	return jsonError("Internal server error", 500);
}


