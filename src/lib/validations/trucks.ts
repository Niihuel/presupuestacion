import { z } from "zod";

export const truckSchema = z.object({
  plate: z.string().min(3, "La placa debe tener al menos 3 caracteres"),
  brand: z.string().optional(),
  model: z.string().optional(),
  capacityTons: z.number().positive().optional(),
  maxLength: z.number().positive().optional(),
  maxPieces: z.number().positive().optional(),
  isCompanyOwned: z.boolean().default(false),
  active: z.boolean().default(true),
  truckType: z.enum(["STANDARD", "MEDIUM", "EXTENDED"]).default("STANDARD"),
  minBillableTons: z.number().positive().optional(),
  description: z.string().optional(),
  companyId: z.string().optional(),
});

export type TruckInput = z.infer<typeof truckSchema>;