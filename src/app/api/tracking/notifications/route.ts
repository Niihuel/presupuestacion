import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

export async function GET() {
	// Endpoint idempotente pensado para ejecutarse vía cron (cada hora)
	const now = new Date();
	const in30d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	const pending = await prisma.projectTracking.findMany({
		where: {
			status: "pendiente",
			scheduledDate: { gte: now, lte: in30d },
		},
		include: { project: true, budget: { include: { customer: true } } },
	});

	let processed = 0;
	for (const t of pending) {
		const daysUntil = differenceInDays(new Date(t.scheduledDate), now);
		const reminderDays = parseArray(t.reminderDays);
		if (reminderDays.includes(daysUntil)) {
			await prisma.systemAlert.create({
				data: {
					level: daysUntil <= 1 ? "critical" : "warning",
					message: `Seguimiento ${t.type} para ${t.project?.name ?? "proyecto"} en ${daysUntil} días`,
				},
			});
			await prisma.trackingNotification.create({
				data: {
					trackingId: t.id,
					type: "system",
					recipient: t.budget?.userId ?? "system",
					status: "sent",
				},
			});
			await prisma.projectTracking.update({ where: { id: t.id }, data: { lastReminder: new Date() } });
			processed++;
		}
	}

	return NextResponse.json({ processed });
}

function parseArray(v: unknown): number[] {
	try { return JSON.parse(String(v ?? "[]")) as number[]; } catch { return []; }
}


