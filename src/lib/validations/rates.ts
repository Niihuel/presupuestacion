import { z } from "zod";

export const materialPriceSchema = z.object({
	materialType: z.string().min(1),
	price: z.number().nonnegative(),
	unit: z.string().max(20).optional(),
	effectiveDate: z.string().datetime(),
	adjustmentPercentage: z.number().optional(),
});

export const freightRateSchema = z.object({
	origin: z.string().min(1).optional(),
	kmFrom: z.number().int().nonnegative(),
	kmTo: z.number().int().nonnegative(),
	rateUnder12m: z.number().nonnegative(),
	rateOver12m: z.number().nonnegative(),
	effectiveDate: z.string().datetime(),
});

export const assemblyRateSchema = z.object({
	kmFrom: z.number().int().nonnegative(),
	kmTo: z.number().int().nonnegative(),
	rateUnder100t: z.number().nonnegative(),
	rate100_300t: z.number().nonnegative(),
	rateOver300t: z.number().nonnegative(),
});

export const polynomialSchema = z.object({
	name: z.string().min(1).optional(),
	steelWeight: z.number().optional(),
	laborWeight: z.number().optional(),
	concreteWeight: z.number().optional(),
	dieselWeight: z.number().optional(),
	steelCoefficient: z.number().optional(),
	laborCoefficient: z.number().optional(),
	concreteCoefficient: z.number().optional(),
	fuelCoefficient: z.number().optional(),
	effectiveDate: z.string().datetime().optional(),
});

export const parameterSchema = z.object({
	name: z.string().min(1),
	value: z.number(),
	unit: z.string().max(20).optional(),
	effectiveDate: z.string().datetime(),
});

export const parameterHistorySchema = z.object({
	parameterId: z.string().min(1),
	value: z.number(),
	effectiveDate: z.string().datetime(),
});

export const monthlyIndexSchema = z.object({
	month: z.number().int().min(1).max(12),
	year: z.number().int().min(2000).max(2100),
	steelIndex: z.number(),
	laborIndex: z.number(),
	concreteIndex: z.number(),
	fuelIndex: z.number(),
	dollar: z.number(),
});

export const adjustmentScaleSchema = z.object({
	name: z.string().min(1),
	version: z.number().int().min(1),
	description: z.string().optional(),
	generalDiscount: z.number(),
	generalAdjustment: z.number(),
	specialAdjustment: z.number().optional(),
	specialCategories: z.string().optional(),
	effectiveDate: z.string().datetime(),
	expirationDate: z.string().datetime().optional(),
	isActive: z.boolean().optional(),
	scales: z.string().optional(), // JSON string
});