import { z } from "zod";

// Enums para familias de piezas
export const PieceFamily = {
	ENTREPISOS: "ENTREPISOS",
	PANELES_W: "PANELES_W", 
	VIGAS_PRETENSADAS: "VIGAS_PRETENSADAS",
	ANTIRUIDO: "ANTIRUIDO",
	CANALES: "CANALES",
	TT: "TT"
} as const;

export type PieceFamilyType = typeof PieceFamily[keyof typeof PieceFamily];

// Moldes por familia
export const MoldsByFamily = {
	ENTREPISOS: ["EN30", "EN35", "EN40", "EN50", "EN65", "EN80"],
	PANELES_W: ["W51"],
	VIGAS_PRETENSADAS: [],
	ANTIRUIDO: [],
	CANALES: [],
	TT: []
} as const;

// Tipos de hormigón
export const ConcreteTypes = {
	H21: "H-21",
	H30: "H-30", 
	H38: "H-38",
	H21_ARS: "H-21 ARS" // Asentamiento Reducido
} as const;

// Ciclos de curado a vapor por familia (temperaturas en °C por hora)
export const VaporCycles = {
	ENTREPISOS: [20, 20, 40, 55, 75, 75, 75, 75, 75, 55, 35, 20],
	PANELES_W: [20, 25, 45, 60, 70, 70, 70, 70, 65, 50, 30, 20],
	VIGAS_PRETENSADAS: [20, 25, 50, 65, 80, 80, 80, 80, 75, 60, 40, 20],
	ANTIRUIDO: [20, 20, 35, 50, 65, 65, 65, 65, 60, 45, 30, 20],
	CANALES: [20, 20, 40, 55, 70, 70, 70, 70, 65, 50, 35, 20],
	TT: [20, 20, 40, 55, 75, 75, 75, 75, 75, 55, 35, 20]
} as const;

export const pieceSchema = z.object({
	familyId: z.string()
		.min(1, "Familia es requerida")
		.max(50, "ID de familia no puede exceder 50 caracteres"),
	plantId: z.string()
		.max(50, "ID de planta no puede exceder 50 caracteres")
		.optional(),
	moldId: z.string()
		.max(50, "ID de molde no puede exceder 50 caracteres")
		.optional(),
	description: z.string()
		.min(1, "Descripción es requerida")
		.max(255, "Descripción no puede exceder 255 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\/\,ñÑáéíóúÁÉÍÓÚüÜ\(\)]+$/, "Descripción contiene caracteres no válidos"),
	weight: z.number()
		.nonnegative("El peso debe ser mayor o igual a cero")
		.max(50000, "El peso no puede exceder 50,000 kg")
		.optional(),
	width: z.number()
		.nonnegative("El ancho debe ser mayor o igual a cero")
		.max(10, "El ancho no puede exceder 10 metros")
		.optional(),
	length: z.number()
		.nonnegative("El largo debe ser mayor o igual a cero")
		.max(50, "El largo no puede exceder 50 metros")
		.optional(),
	thickness: z.number()
		.nonnegative("El espesor debe ser mayor o igual a cero")
		.max(2, "El espesor no puede exceder 2 metros")
		.optional(),
	height: z.number()
		.nonnegative("La altura debe ser mayor o igual a cero")
		.max(5, "La altura no puede exceder 5 metros")
		.optional(),
	section: z.string()
		.max(120, "Sección no puede exceder 120 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\/ñÑáéíóúÁÉÍÓÚüÜ]*$/, "Sección contiene caracteres no válidos")
		.optional(),
	volume: z.number()
		.nonnegative("El volumen debe ser mayor o igual a cero")
		.max(100, "El volumen no puede exceder 100 m³")
		.optional(),
	unitMeasure: z.string()
		.max(50, "Unidad de medida no puede exceder 50 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.]*$/, "Unidad de medida contiene caracteres no válidos")
		.optional(),
	priceCordoba: z.number()
		.nonnegative("El precio de Córdoba debe ser mayor o igual a cero")
		.max(9999999.99, "El precio de Córdoba no puede exceder $9,999,999.99")
		.optional(),
	priceBuenosAires: z.number()
		.nonnegative("El precio de Buenos Aires debe ser mayor o igual a cero")
		.max(9999999.99, "El precio de Buenos Aires no puede exceder $9,999,999.99")
		.optional(),
	priceVillaMaria: z.number()
		.nonnegative("El precio de Villa María debe ser mayor o igual a cero")
		.max(9999999.99, "El precio de Villa María no puede exceder $9,999,999.99")
		.optional(),
	allowsOptional: z.boolean()
		.optional(),
	individualTransport: z.boolean()
		.optional(),
	piecesPerTruck: z.number()
		.int("Las piezas por camión debe ser un número entero")
		.positive("Las piezas por camión debe ser mayor a cero")
		.max(100, "Las piezas por camión no pueden exceder 100")
		.optional(),
	// Nuevos campos
	productionTime: z.number()
		.int("El tiempo de producción debe ser un número entero")
		.positive("El tiempo de producción debe ser mayor a cero")
		.max(240, "El tiempo de producción no puede exceder 240 horas")
		.optional(),
	concreteType: z.string()
		.max(50, "Tipo de hormigón no puede exceder 50 caracteres")
		.regex(/^[A-Z0-9\s\-]*$/, "Tipo de hormigón contiene caracteres no válidos")
		.optional(),
	steelQuantity: z.number()
		.nonnegative("La cantidad de acero debe ser mayor o igual a cero")
		.max(10000, "La cantidad de acero no puede exceder 10,000 kg")
		.optional(),
	requiresEscort: z.boolean()
		.optional(),
	maxStackable: z.number()
		.int("El máximo apilable debe ser un número entero")
		.positive("El máximo apilable debe ser mayor a cero")
		.max(20, "El máximo apilable no puede exceder 20")
		.optional(),
	specialHandling: z.string()
		.max(500, "Manejo especial no puede exceder 500 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\/\,ñÑáéíóúÁÉÍÓÚüÜ\(\)]*$/, "Manejo especial contiene caracteres no válidos")
		.optional(),
	// Campos específicos por familia
	cableCount: z.number()
		.int("La cantidad de cables debe ser un número entero")
		.min(0, "La cantidad de cables debe ser mayor o igual a cero")
		.max(50, "La cantidad de cables no puede exceder 50")
		.optional(),
	meshLayers: z.number()
		.int("Las capas de malla debe ser un número entero")
		.min(0, "Las capas de malla debe ser mayor o igual a cero")
		.max(2, "Las capas de malla no pueden exceder 2")
		.optional(),
	hasAntiseismic: z.boolean()
		.optional(),
	hasInsulation: z.boolean()
		.optional(),
	trackLength: z.number()
		.nonnegative("La longitud de pista debe ser mayor o igual a cero")
		.max(200, "La longitud de pista no puede exceder 200 metros")
		.optional(),
	hasTelgopor: z.boolean()
		.optional(),
	concreteSettlement: z.number()
		.nonnegative("El asentamiento debe ser mayor o igual a cero")
		.max(25, "El asentamiento no puede exceder 25 cm")
		.optional(),
	// BOM de materiales (PieceMaterial)
	materials: z
    .array(
      z.object({
        materialId: z.string()
				.min(1, "Seleccione un material")
				.max(50, "ID de material no puede exceder 50 caracteres"),
        quantity: z.number()
				.nonnegative({ message: "Cantidad debe ser mayor o igual a cero" })
				.max(999999.99, "Cantidad no puede exceder 999,999.99"),
        scrap: z.number()
          .min(0, "Merma mínima 0%")
          .max(100, "Merma máxima 100%")
          .default(0),
      })
    )
    .optional()
    .default([]),
});

export const pieceFamilySchema = z.object({
	code: z.string()
		.min(1, "Código es requerido")
		.max(50, "Código no puede exceder 50 caracteres")
		.regex(/^[A-Z0-9_-]+$/, "Código debe contener solo letras mayúsculas, números, guiones y guiones bajos"),
	description: z.string()
		.max(255, "Descripción no puede exceder 255 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\/\,ñÑáéíóúÁÉÍÓÚüÜ]*$/, "Descripción contiene caracteres no válidos")
		.optional(),
	category: z.string()
		.max(100, "Categoría no puede exceder 100 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.]*$/, "Categoría contiene caracteres no válidos")
		.optional(),
	requiresMold: z.boolean()
		.optional(),
	requiresCables: z.boolean()
		.optional(),
	requiresVaporCycle: z.boolean()
		.optional(),
	maxCables: z.number()
		.int("El máximo de cables debe ser un número entero")
		.positive("El máximo de cables debe ser mayor a cero")
		.max(100, "El máximo de cables no puede exceder 100")
		.optional(),
	defaultConcreteType: z.string()
		.max(50, "Tipo de hormigón por defecto no puede exceder 50 caracteres")
		.regex(/^[A-Z0-9\s\-]*$/, "Tipo de hormigón contiene caracteres no válidos")
		.optional(),
});

export const moldSchema = z.object({
	familyId: z.string()
		.min(1, "Familia es requerida")
		.max(50, "ID de familia no puede exceder 50 caracteres"),
	code: z.string()
		.min(1, "Código es requerido")
		.max(20, "Código no puede exceder 20 caracteres")
		.regex(/^[A-Z0-9_-]+$/, "Código debe contener solo letras mayúsculas, números, guiones y guiones bajos"),
	description: z.string()
		.max(255, "Descripción no puede exceder 255 caracteres")
		.regex(/^[a-zA-Z0-9\s\-\.\/\,ñÑáéíóúÁÉÍÓÚüÜ]*$/, "Descripción contiene caracteres no válidos")
		.optional(),
	plantId: z.string()
		.max(50, "ID de planta no puede exceder 50 caracteres")
		.optional(),
	active: z.boolean().optional(),
});

// Legacy schemas for backward compatibility
export const pieceCreateSchema = pieceSchema;
export const pieceUpdateSchema = pieceSchema.partial();
export const pieceFamilyCreateSchema = pieceFamilySchema;
export const pieceFamilyUpdateSchema = pieceFamilySchema.partial();

// Input formatters for consistent data entry
export const formatters = {
	description: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\/\,ñÑáéíóúÁÉÍÓÚüÜ\(\)]/g, '')
			.slice(0, 255);
	},
	section: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\/ñÑáéíóúÁÉÍÓÚüÜ]/g, '')
			.slice(0, 120);
	},
	unitMeasure: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.]/g, '')
			.slice(0, 50);
	},
	concreteType: (value: string) => {
		return value
			.toUpperCase()
			.replace(/[^A-Z0-9\s\-]/g, '')
			.slice(0, 50);
	},
	specialHandling: (value: string) => {
		return value
			.replace(/[^a-zA-Z0-9\s\-\.\/\,ñÑáéíóúÁÉÍÓÚüÜ\(\)]/g, '')
			.slice(0, 500);
	},
	// Numeric formatters
	weight: (value: string) => {
		const cleaned = value.replace(/[^0-9.]/g, '');
		const parts = cleaned.split('.');
		if (parts.length > 2) {
			return parts[0] + '.' + parts.slice(1).join('');
		}
		if (parts[0].length > 5) {
			parts[0] = parts[0].slice(0, 5);
		}
		if (parts[1] && parts[1].length > 2) {
			parts[1] = parts[1].slice(0, 2);
		}
		return parts.join('.');
	},
	dimensions: (value: string) => {
		const cleaned = value.replace(/[^0-9.]/g, '');
		const parts = cleaned.split('.');
		if (parts.length > 2) {
			return parts[0] + '.' + parts.slice(1).join('');
		}
		if (parts[0].length > 3) {
			parts[0] = parts[0].slice(0, 3);
		}
		if (parts[1] && parts[1].length > 3) {
			parts[1] = parts[1].slice(0, 3);
		}
		return parts.join('.');
	},
	price: (value: string) => {
		const cleaned = value.replace(/[^0-9.]/g, '');
		const parts = cleaned.split('.');
		if (parts.length > 2) {
			return parts[0] + '.' + parts.slice(1).join('');
		}
		if (parts[0].length > 7) {
			parts[0] = parts[0].slice(0, 7);
		}
		if (parts[1] && parts[1].length > 2) {
			parts[1] = parts[1].slice(0, 2);
		}
		return parts.join('.');
	},
	integer: (value: string) => {
		return value.replace(/[^0-9]/g, '').slice(0, 3);
	},
	quantity: (value: string) => {
		const cleaned = value.replace(/[^0-9.]/g, '');
		const parts = cleaned.split('.');
		if (parts.length > 2) {
			return parts[0] + '.' + parts.slice(1).join('');
		}
		if (parts[0].length > 6) {
			parts[0] = parts[0].slice(0, 6);
		}
		if (parts[1] && parts[1].length > 3) {
			parts[1] = parts[1].slice(0, 3);
		}
		return parts.join('.');
	},
	percentage: (value: string) => {
		const cleaned = value.replace(/[^0-9.]/g, '');
		const parts = cleaned.split('.');
		if (parts.length > 2) {
			return parts[0] + '.' + parts.slice(1).join('');
		}
		if (parts[0].length > 2) {
			parts[0] = parts[0].slice(0, 2);
		}
		if (parts[1] && parts[1].length > 1) {
			parts[1] = parts[1].slice(0, 1);
		}
		return parts.join('.');
	},
	// Family formatters
	familyCode: (value: string) => {
		return value
			.toUpperCase()
			.replace(/[^A-Z0-9_-]/g, '')
			.slice(0, 50);
	},
	moldCode: (value: string) => {
		return value
			.toUpperCase()
			.replace(/[^A-Z0-9_-]/g, '')
			.slice(0, 20);
	}
};


