import { z } from "zod";

export const roleSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(255).optional(),
});

export const permissionSchema = z.object({
	resource: z.string().min(1).max(100),
	action: z.string().min(1).max(50),
});


