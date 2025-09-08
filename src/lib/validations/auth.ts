import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres").max(128),
});

export const registerSchema = z.object({
	firstName: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
	lastName: z.string().min(2, "Apellido debe tener al menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres").max(128),
	confirmPassword: z.string(),
	phone: z.string().optional(),
	department: z.string().optional(),
	position: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
	message: "Las contraseñas no coinciden",
	path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;


