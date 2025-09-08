import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
	const session = await getServerSession(authOptions);
	if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
	return NextResponse.json({ ok: true });
}


