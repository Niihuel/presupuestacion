import { z } from "zod";

export const budgetSchema = z.object({
	projectId: z.string().min(1),
	customerId: z.string().min(1),
	userId: z.string().min(1),
	status: z.string().min(1).optional(),
	requestDate: z.string().datetime().optional(),
	budgetDate: z.string().datetime().optional(),
	deliveryTerms: z.string().max(255).optional(),
	paymentConditions: z.string().max(255).optional(),
	validityDays: z.number().int().optional(),
	notes: z.string().max(4000).optional(),
});

export const budgetItemSchema = z.object({
	pieceId: z.string().min(1),
	quantity: z.number().int().positive(),
	length: z.number().nonnegative().optional(),
	unitPrice: z.number().nonnegative().optional(),
	adjustment: z.number().optional(),
	originPlant: z.string().optional(),
	optional: z.boolean().optional(),
});

export const additionalSchema = z.object({
	description: z.string().min(1),
	quantity: z.number().int().positive(),
	unitPrice: z.number().nonnegative(),
});

export const statusSchema = z.object({ status: z.string().min(1) });
export const observationSchema = z.object({
	observation: z.string().min(1),
	nextContactDate: z.string().datetime().optional(),
	alertEnabled: z.boolean().optional(),
});


