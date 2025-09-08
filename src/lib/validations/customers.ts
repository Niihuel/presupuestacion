import { z } from "zod";

// Phone number validation regex (supports various formats)
const phoneRegex = /^[+]?[(]?[\d\s().-]{7,20}$/;

// CUIT/CUIL validation regex (Argentina tax ID)
const cuitRegex = /^\d{2}-\d{8}-\d{1}$|^\d{11}$/;

// Email validation with stricter rules
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Postal code regex (Argentina format)
const postalCodeRegex = /^[A-Z]?\d{4}[A-Z]{0,3}$|^\d{4}$/;

// Name validation regex (letters, spaces, hyphens, apostrophes only)
const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'.-]+$/;

// Address validation regex (letters, numbers, spaces, and common punctuation)
const addressRegex = /^[a-zA-Z0-9À-ÿ\u00f1\u00d1\s'.,#/-]+$/;

// Company name validation (more permissive for business names)
const companyNameRegex = /^[a-zA-Z0-9À-ÿ\u00f1\u00d1\s'.,&()-]+$/;

export const customerCreateSchema = z.object({
	displayName: z.string()
		.min(2, "El nombre debe tener al menos 2 caracteres")
		.max(100, "El nombre no puede exceder 100 caracteres")
		.regex(nameRegex, "El nombre solo puede contener letras, espacios, guiones y apostrofes")
		.transform(str => str.trim())
		.optional(),
	
	companyName: z.string()
		.min(2, "El nombre de empresa es requerido y debe tener al menos 2 caracteres")
		.max(150, "El nombre de empresa no puede exceder 150 caracteres")
		.regex(companyNameRegex, "El nombre de empresa contiene caracteres no válidos")
		.transform(str => str.trim()),
	
	taxId: z.string()
		.regex(cuitRegex, "El CUIT debe tener el formato XX-XXXXXXXX-X o 11 dígitos consecutivos")
		.transform(str => str.replace(/[^0-9-]/g, ''))
		.optional()
		.or(z.literal('')),
	
	address: z.string()
		.min(5, "La dirección debe tener al menos 5 caracteres")
		.max(200, "La dirección no puede exceder 200 caracteres")
		.regex(addressRegex, "La dirección contiene caracteres no válidos")
		.transform(str => str.trim())
		.optional()
		.or(z.literal('')),
	
	city: z.string()
		.min(2, "La ciudad debe tener al menos 2 caracteres")
		.max(80, "La ciudad no puede exceder 80 caracteres")
		.regex(nameRegex, "La ciudad solo puede contener letras, espacios y guiones")
		.transform(str => str.trim())
		.optional()
		.or(z.literal('')),
	
	province: z.string()
		.min(2, "La provincia debe tener al menos 2 caracteres")
		.max(80, "La provincia no puede exceder 80 caracteres")
		.regex(nameRegex, "La provincia solo puede contener letras, espacios y guiones")
		.transform(str => str.trim())
		.optional()
		.or(z.literal('')),
	
	postalCode: z.string()
		.regex(postalCodeRegex, "El código postal debe tener formato válido (ej: 1234, A1234ABC)")
		.transform(str => str.toUpperCase().replace(/\s/g, ''))
		.optional()
		.or(z.literal('')),
	
	phone: z.string()
		.min(7, "El teléfono debe tener al menos 7 dígitos")
		.max(20, "El teléfono no puede exceder 20 caracteres")
		.regex(phoneRegex, "Formato de teléfono inválido")
		.transform(str => str.replace(/\s+/g, ' ').trim())
		.optional()
		.or(z.literal('')),
	
	email: z.string()
		.min(5, "El email debe tener al menos 5 caracteres")
		.max(100, "El email no puede exceder 100 caracteres")
		.regex(emailRegex, "Formato de email inválido")
		.transform(str => str.toLowerCase().trim())
		.optional()
		.or(z.literal('')),
	
	contactPerson: z.string()
		.min(2, "El nombre del contacto debe tener al menos 2 caracteres")
		.max(100, "El nombre del contacto no puede exceder 100 caracteres")
		.regex(nameRegex, "El nombre del contacto solo puede contener letras, espacios, guiones y apostrofes")
		.transform(str => str.trim())
		.optional()
		.or(z.literal('')),
	
	activityType: z.string()
		.max(100, "El tipo de actividad no puede exceder 100 caracteres")
		.regex(nameRegex, "El tipo de actividad contiene caracteres no válidos")
		.transform(str => str.trim())
		.optional()
		.or(z.literal('')),
	
	customerType: z.string()
		.max(100, "El tipo de cliente no puede exceder 100 caracteres")
		.regex(nameRegex, "El tipo de cliente contiene caracteres no válidos")
		.transform(str => str.trim())
		.optional()
		.or(z.literal('')),
	
	companyId: z.string().optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

// Helper functions for input formatting and validation
export const formatters = {
	phone: (value: string) => {
		// Remove all non-digits first, then format
		const cleaned = value.replace(/\D/g, '');
		if (cleaned.length === 0) return '';
		
		// Format based on length
		if (cleaned.length <= 3) return cleaned;
		if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
		if (cleaned.length <= 10) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
		return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
	},
	
	cuit: (value: string) => {
		// Remove all non-digits
		const cleaned = value.replace(/\D/g, '');
		if (cleaned.length === 0) return '';
		
		// Format as XX-XXXXXXXX-X
		if (cleaned.length <= 2) return cleaned;
		if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
		return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10, 11)}`;
	},
	
	postalCode: (value: string) => {
		// Keep only alphanumeric characters and convert to uppercase
		return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
	},
	
	name: (value: string) => {
		// Remove invalid characters and trim
		return value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s'.-]/g, '').trim();
	},
	
	address: (value: string) => {
		// Remove invalid characters and trim
		return value.replace(/[^a-zA-Z0-9À-ÿ\u00f1\u00d1\s'.,#/-]/g, '').trim();
	},
	
	email: (value: string) => {
		// Convert to lowercase and remove invalid characters
		return value.toLowerCase().replace(/[^a-z0-9._%+-@]/g, '');
	}
};


