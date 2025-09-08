import { z } from "zod";

export const projectCreateSchema = z.object({
	customerId: z.string().min(1, "Cliente es requerido"),
	name: z.string()
		.min(1, "Nombre es requerido")
		.max(200, "Nombre no puede exceder 200 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]+$/, "Nombre contiene caracteres no válidos"),
	description: z.string()
		.max(2000, "Descripción no puede exceder 2000 caracteres")
		.optional(),
	address: z.string()
		.max(255, "Dirección no puede exceder 255 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]*$/, "Dirección contiene caracteres no válidos")
		.optional(),
	city: z.string()
		.max(120, "Ciudad no puede exceder 120 caracteres")
		.regex(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]*$/, "Ciudad contiene caracteres no válidos")
		.optional(),
	province: z.string()
		.max(120, "Provincia no puede exceder 120 caracteres")
		.regex(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]*$/, "Provincia contiene caracteres no válidos")
		.optional(),
	postalCode: z.string()
		.max(20, "Código postal no puede exceder 20 caracteres")
		.regex(/^[A-Z]?\d{4}[A-Z]{0,3}$|^\d{4}$/, "Código postal debe tener formato válido (ej: 1234 o A1234ABC)")
		.optional(),
	googleMapsUrl: z.string()
		.optional()
		.refine((value) => {
			if (!value || value.trim() === '') return true;
			// Accept iframe HTML or direct embed URLs
			return value.includes('<iframe') || value.includes('maps.google') || value.includes('maps/embed') || value.startsWith('http');
		}, "Debe ser una URL de Google Maps o código iframe válido")
		.or(z.literal("")),
	distanceFromCordoba: z.number().int().nonnegative().optional(),
	distanceFromBuenosAires: z.number().int().nonnegative().optional(),
	distanceFromVillaMaria: z.number().int().nonnegative().optional(),
	status: z.string().max(50).optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const projectFileSchema = z.object({
	projectId: z.string().min(1),
	fileName: z.string().min(1),
	fileUrl: z.string().url(),
	fileType: z.string().min(1),
});

export const projectModel3DSchema = z.object({
	projectId: z.string().min(1),
	modelUrl: z.string().url(),
	thumbnailUrl: z.string().url().optional(),
});

// Input formatters for consistent data entry
export const formatters = {
	name: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]/g, '')
			.slice(0, 200);
	},
	address: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]/g, '')
			.slice(0, 255);
	},
	city: (value: string) => {
		return value
			.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]/g, '')
			.replace(/\s+/g, ' ')
			.slice(0, 120);
	},
	province: (value: string) => {
		return value
			.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]/g, '')
			.replace(/\s+/g, ' ')
			.slice(0, 120);
	},
	postalCode: (value: string) => {
		return value
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '')
			.slice(0, 8);
	},
	description: (value: string) => {
		return value.slice(0, 2000);
	},
	googleMapsUrl: (value: string) => {
		// Clean and validate Google Maps URL or iframe code
		if (!value || value.trim() === '') return '';
		const cleanValue = value.trim();
		
		// If it's an iframe, clean it up and return
		if (cleanValue.includes('<iframe')) {
			// Remove any extra whitespace and ensure it's properly formatted
			return cleanValue.replace(/\s+/g, ' ').trim();
		}
		
		// If it's a URL, return as is
		if (cleanValue.startsWith('http') || cleanValue.includes('maps.google') || cleanValue.includes('maps/embed')) {
			return cleanValue;
		}
		
		return cleanValue;
	}
};


