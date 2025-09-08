import { z } from "zod";

export const idSchema = z.string().min(1);

export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional(),
	pageSize: z.coerce.number().int().min(1).max(100).optional(),
});


