import { prisma } from "@/lib/prisma";
import { jsonOK, jsonCreated, jsonError } from "@/lib/api";
import { getSessionUser } from "@/lib/authz";

export async function POST() {
  try {
    // Check if a formula already exists
    const existingFormula = await prisma.polynomialFormula.findFirst();
    
    if (existingFormula) {
      return jsonOK({ message: "Formula already exists", formula: existingFormula });
    }
    
    // Get user session if available (for createdBy field)
    const user = await getSessionUser();
    
    // Create default formula
    const defaultFormula = await prisma.polynomialFormula.create({
      data: {
        steelCoefficient: 0.4,
        laborCoefficient: 0.3,
        concreteCoefficient: 0.2,
        fuelCoefficient: 0.1,
        effectiveDate: new Date(),
        createdBy: user?.id || null
      }
    });
    
    return jsonCreated({ message: "Default formula created", formula: defaultFormula });
  } catch (error: any) {
    console.error("Error initializing polynomial formula:", error);
    return jsonError("Failed to initialize polynomial formula: " + error.message, 500);
  }
}