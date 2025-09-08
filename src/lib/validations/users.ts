import { z } from "zod";

export const userCreateSchema = z.object({
	firstName: z.string().min(1).max(100).optional(),
	lastName: z.string().min(1).max(100).optional(),
	email: z.string().email(),
	password: z.string().min(6).max(128).optional(),
	roleId: z.string().optional(),
	companyId: z.string().optional(),
	active: z.boolean().optional(),
});

export const userUpdateSchema = userCreateSchema.partial();


