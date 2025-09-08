import { NextResponse } from "next/server";

export async function POST() {
	// En NextAuth v4, el signOut se maneja desde el cliente o redirección
	return NextResponse.json({ ok: true });
}


