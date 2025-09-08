import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonCreated, jsonError } from "@/lib/api";

function generateToken() {
	return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function POST(req: Request) {
	await requirePermission("budgets", "create");
	const { budgetId, step, data, completed } = await req.json();
	if (!step || step < 1 || step > 6) return jsonError("Invalid step", 400);

	// Normalizar strings JSON
	const incomingData = typeof data === "string" ? data : JSON.stringify(data ?? {});

	let createdOrUpdated;
	if (budgetId) {
		const existing = await prisma.budget.findUnique({ where: { id: String(budgetId) } });
		if (!existing) return jsonError("Budget not found", 404);
		const mergedDraftData = mergeJsonStrings(existing.draftData ?? "{}", incomingData);
		const nextCompleted = completed
			? uniqueNumbers(addToArrayString(existing.completedSteps ?? "[]", step))
			: safeParseArray(existing.completedSteps ?? "[]");
		createdOrUpdated = await prisma.budget.update({
			where: { id: existing.id },
			data: {
				isDraft: true,
				draftStep: step,
				draftData: mergedDraftData,
				completedSteps: JSON.stringify(nextCompleted),
				lastEditedAt: new Date(),
			},
		});
	} else {
		createdOrUpdated = await prisma.budget.create({
			data: {
				isDraft: true,
				draftStep: step,
				draftData: incomingData,
				completedSteps: JSON.stringify(completed ? [step] : []),
				resumeToken: generateToken(),
				// Datos mínimos requeridos (relaciones no estrictas por relationMode)
				customerId: (JSON.parse(incomingData).customerId ?? "") as string,
				projectId: (JSON.parse(incomingData).projectId ?? "") as string,
				userId: (JSON.parse(incomingData).userId ?? "") as string,
				status: "draft",
				version: 1,
			},
		});
	}

	await prisma.budgetDraftHistory.create({
		data: {
			budgetId: createdOrUpdated.id,
			step,
			data: incomingData,
		},
	});

	return jsonCreated({ budgetId: createdOrUpdated.id, resumeToken: createdOrUpdated.resumeToken });
}

function mergeJsonStrings(a: string, b: string): string {
	try {
		const o1 = JSON.parse(a || "{}");
		const o2 = JSON.parse(b || "{}");
		return JSON.stringify({ ...o1, ...o2 });
	} catch {
		return b || a || "{}";
	}
}

function addToArrayString(arrStr: string, value: number): number[] {
	const arr = safeParseArray(arrStr);
	arr.push(value);
	return arr;
}

function safeParseArray(v: unknown): number[] {
	try { return JSON.parse(String(v ?? "[]")) as number[]; } catch { return []; }
}

function uniqueNumbers(arr: number[]): number[] { return Array.from(new Set(arr)); }


