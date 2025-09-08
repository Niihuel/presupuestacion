import { z } from "zod";

export const plantCreateSchema = z.object({
	name: z.string()
		.min(1, "Nombre es requerido")
		.max(150, "Nombre no puede exceder 150 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]+$/, "Nombre contiene caracteres no válidos"),
	location: z.string()
		.max(255, "Ubicación no puede exceder 255 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]*$/, "Ubicación contiene caracteres no válidos")
		.optional(),
	address: z.string()
		.max(255, "Dirección no puede exceder 255 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]*$/, "Dirección contiene caracteres no válidos")
		.optional(),
	googleMapsUrl: z.string()
		.optional()
		.refine((value) => {
			if (!value || value.trim() === '') return true;
			// Accept iframe HTML or direct embed URLs
			return value.includes('<iframe') || value.includes('maps.google') || value.includes('maps/embed') || value.startsWith('http');
		}, "Debe ser una URL de Google Maps o código iframe válido")
		.or(z.literal("")),
	active: z.boolean().optional(),
	companyId: z.string().optional(),
});

export const plantUpdateSchema = plantCreateSchema.partial();

// Legacy schema for backward compatibility
export const plantSchema = plantCreateSchema;

// Input formatters for consistent data entry
export const formatters = {
	name: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]/g, '')
			.slice(0, 150);
	},
	location: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]/g, '')
			.slice(0, 255);
	},
	address: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]/g, '')
			.slice(0, 255);
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


