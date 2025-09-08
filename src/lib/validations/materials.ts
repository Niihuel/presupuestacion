import { z } from "zod";

// Categorías de materiales
export const MaterialCategory = {
	HORMIGON: "hormigon",
	ACERO: "acero",
	ADITIVO: "aditivo",
	ACCESORIO: "accesorio",
	ENERGIA: "energia"
} as const;

export type MaterialCategoryType = typeof MaterialCategory[keyof typeof MaterialCategory];

// Export arrays for compatibility
export const MATERIAL_CATEGORIES = [
  { value: "hormigon", label: "Hormigón" },
  { value: "acero", label: "Acero" },
  { value: "aditivo", label: "Aditivo" },
  { value: "accesorio", label: "Accesorio" },
  { value: "energia", label: "Energía" }
];

// Unidades de medida
export const MaterialUnit = {
	M3: "m3",     // Metro cúbico
	KG: "kg",     // Kilogramo
	TON: "ton",   // Tonelada
	LT: "lt",     // Litro
	UN: "un",     // Unidad
	KWH: "kWh",   // Kilowatt hora
	M2: "m2",     // Metro cuadrado
	ML: "ml"      // Metro lineal
} as const;

// Export arrays for compatibility
export const MATERIAL_UNITS = [
  { value: "m3", label: "m³" },
  { value: "kg", label: "kg" },
  { value: "ton", label: "ton" },
  { value: "lt", label: "lt" },
  { value: "un", label: "un" },
  { value: "kWh", label: "kWh" },
  { value: "m2", label: "m²" },
  { value: "ml", label: "ml" }
];

// Fórmula especial para ANTIRUIDO (por m³)
export const ANTIRUIDO_FORMULA = {
	BLINDER: 1412,      // kg
	CEMENTO: 318,       // kg
	AGUA: 70,           // kg
	SUPERFLUID: 2.55    // kg
} as const;

// Validación para materiales
export const materialCreateSchema = z.object({
	code: z.string()
		.min(1, "Código es requerido")
		.max(20, "Código no puede exceder 20 caracteres")
		.regex(/^[A-Z0-9_-]+$/, "Código debe contener solo letras mayúsculas, números, guiones y guiones bajos"),
	name: z.string()
		.min(1, "Nombre es requerido")
		.max(150, "Nombre no puede exceder 150 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]+$/, "Nombre contiene caracteres no válidos"),
	category: z.enum(["hormigon", "acero", "aditivo", "accesorio", "energia"]),
	unit: z.enum(["m3", "kg", "ton", "lt", "un", "kWh", "m2", "ml"]),
	currentPrice: z.number()
		.nonnegative("El precio debe ser mayor o igual a cero")
		.max(999999.99, "El precio no puede exceder $999,999.99"),
	supplier: z.string()
		.max(255, "Proveedor no puede exceder 255 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]*$/, "Proveedor contiene caracteres no válidos")
		.optional(),
	minimumStock: z.number()
		.nonnegative("El stock mínimo debe ser mayor o igual a cero")
		.max(999999, "El stock mínimo no puede exceder 999,999")
		.optional(),
	active: z.boolean().optional(),
});

export const materialUpdateSchema = materialCreateSchema.partial();

// Legacy schema for backward compatibility
export const materialSchema = materialCreateSchema;

// Input formatters for consistent data entry
export const formatters = {
	code: (value: string) => {
		return value
			.toUpperCase()
			.replace(/[^A-Z0-9_-]/g, '')
			.slice(0, 20);
	},
	name: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]/g, '')
			.slice(0, 150);
	},
	supplier: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\,ñÑáéíóúÁÉÍÓÚüÜ]/g, '')
			.slice(0, 255);
	},
	currentPrice: (value: string) => {
		// Remove non-numeric characters except decimal point
		const cleaned = value.replace(/[^0-9.]/g, '');
		// Ensure only one decimal point
		const parts = cleaned.split('.');
		if (parts.length > 2) {
			return parts[0] + '.' + parts.slice(1).join('');
		}
		// Limit to 6 digits before decimal and 2 after
		if (parts[0].length > 6) {
			parts[0] = parts[0].slice(0, 6);
		}
		if (parts[1] && parts[1].length > 2) {
			parts[1] = parts[1].slice(0, 2);
		}
		return parts.join('.');
	},
	minimumStock: (value: string) => {
		// Remove non-numeric characters
		const cleaned = value.replace(/[^0-9]/g, '');
		// Limit to 6 digits
		return cleaned.slice(0, 6);
	}
};

// Validación para recetas
export const pieceRecipeSchema = z.object({
	pieceId: z.string().min(1),
	familyId: z.string().min(1),
	moldId: z.string().optional(),
	name: z.string().min(1),
	version: z.number().int().positive().optional(),
	active: z.boolean().optional(),
	laborHours: z.number().nonnegative().optional(),
	equipmentHours: z.number().nonnegative().optional(),
	vaporCycleHours: z.number().nonnegative().optional(),
	vaporTemperature: z.string().optional(), // JSON array
});

// Validación para detalles de receta
export const recipeDetailSchema = z.object({
	recipeId: z.string().min(1),
	materialId: z.string().min(1),
	quantity: z.number().nonnegative(),
	unit: z.string().min(1),
	isOptional: z.boolean().optional(),
	notes: z.string().optional(),
});

// Validación para histórico de precios
export const priceHistorySchema = z.object({
	materialId: z.string().min(1),
	price: z.number().nonnegative(),
	changeReason: z.string().optional(),
	changePercent: z.number().optional(),
	effectiveDate: z.date().optional(),
});

// Cálculo automático de materiales por tipo de pieza
export interface MaterialCalculation {
	materialId: string;
	quantity: number;
	unit: string;
	formula?: string; // Descripción de la fórmula utilizada
}

// Función para calcular materiales automáticamente
export function calculateMaterials(
	familyCode: string,
	volume: number,
	area?: number,
	cableCount?: number,
	length?: number
): MaterialCalculation[] {
	const materials: MaterialCalculation[] = [];
	
	// Hormigón base
	materials.push({
		materialId: "concrete",
		quantity: volume,
		unit: "m3",
		formula: "Volumen de la pieza"
	});
	
	// Separadores (5 unidades/m²)
	if (area) {
		materials.push({
			materialId: "separators",
			quantity: area * 5,
			unit: "un",
			formula: "5 unidades por m²"
		});
	}
	
	// Acero/cables
	if (cableCount && length) {
		materials.push({
			materialId: "steel_cables",
			quantity: cableCount * length * 0.89, // 0.89 kg/m para cordón de 1/2"
			unit: "kg",
			formula: "Cantidad de cables × longitud × 0.89 kg/m"
		});
	}
	
	// Fórmula especial para ANTIRUIDO
	if (familyCode === "ANTIRUIDO") {
		materials.push(
			{
				materialId: "blinder",
				quantity: ANTIRUIDO_FORMULA.BLINDER * volume,
				unit: "kg",
				formula: `${ANTIRUIDO_FORMULA.BLINDER} kg/m³`
			},
			{
				materialId: "cement",
				quantity: ANTIRUIDO_FORMULA.CEMENTO * volume,
				unit: "kg",
				formula: `${ANTIRUIDO_FORMULA.CEMENTO} kg/m³`
			},
			{
				materialId: "water",
				quantity: ANTIRUIDO_FORMULA.AGUA * volume,
				unit: "kg",
				formula: `${ANTIRUIDO_FORMULA.AGUA} kg/m³`
			},
			{
				materialId: "superfluid",
				quantity: ANTIRUIDO_FORMULA.SUPERFLUID * volume,
				unit: "kg",
				formula: `${ANTIRUIDO_FORMULA.SUPERFLUID} kg/m³`
			}
		);
	}
	
	return materials;
}

// Validación de restricciones de producción
export function validateProductionRestrictions(
	plantName: string,
	familyCode: string,
	moldCode?: string,
	trackLength?: number
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	
	// Validaciones para Buenos Aires
	if (plantName === "Buenos Aires") {
		if (trackLength === 102) {
			errors.push("Buenos Aires no tiene pista de 102m");
		}
		// Agregar más restricciones de moldes según necesidad
	}
	
	// Validar peso y longitud para transporte especial
	// Se haría en función de las dimensiones de la pieza
	
	return {
		valid: errors.length === 0,
		errors
	};
}

// Cálculo de costo energético del ciclo de vapor
export function calculateVaporEnergyCost(
	familyCode: string,
	weight: number, // en toneladas
	energyPricePerKwh: number
): number {
	const consumptionPerTon = 17.5; // kWh/ton promedio
	const totalKwh = weight * consumptionPerTon;
	return totalKwh * energyPricePerKwh;
}