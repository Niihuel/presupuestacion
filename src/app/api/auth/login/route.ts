import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
	const data = await req.json();
	const parsed = loginSchema.safeParse(data);
	if (!parsed.success) {
		return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
	}
	// La autenticación real se maneja en /api/auth/[...nextauth].
	return NextResponse.json({ ok: true });
}


