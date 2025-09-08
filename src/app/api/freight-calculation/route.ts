import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/authz';
import { jsonOK, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { calculateFreight, getPlantCode } from '@/lib/services/freight-calculation';

export async function POST(req: NextRequest) {
  try {
    // Verify permissions
    await requirePermission("budgets", "view");
    
    const body = await req.json();
    const { pieces, distanceKm, destinationCity } = body;
    
    if (!pieces || !Array.isArray(pieces) || pieces.length === 0) {
      return jsonError("Debe proporcionar al menos una pieza para calcular el flete", 400);
    }
    
    if (!distanceKm || isNaN(Number(distanceKm))) {
      return jsonError("Debe proporcionar una distancia válida en kilómetros", 400);
    }
    
    // Fetch additional piece information from database if not provided
    const enhancedPieces = await Promise.all(pieces.map(async (piece: any) => {
      // If all required data is provided, use it directly
      if (piece.weight && piece.length && piece.plantId) {
        return {
          id: piece.id,
          weight: Number(piece.weight),
          length: Number(piece.length),
          quantity: Number(piece.quantity || 1),
          plantId: piece.plantId,
          requiresEscort: piece.requiresEscort || false
        };
      }
      
      // Otherwise, fetch missing data from database
      const pieceData = await prisma.piece.findUnique({
        where: { id: piece.id },
        select: {
          weight: true,
          length: true,
          plantId: true,
          requiresEscort: true
        }
      });
      
      if (!pieceData) {
        throw new Error(`Pieza con ID ${piece.id} no encontrada`);
      }
      
      // If plantId is missing, use a default plant
      if (!pieceData.plantId) {
        const defaultPlant = await prisma.plant.findFirst({
          where: { active: true },
          select: { id: true }
        });
        
        if (!defaultPlant) {
          throw new Error("No se encontró ninguna planta activa en el sistema");
        }
        
        pieceData.plantId = defaultPlant.id;
      }
      
      return {
        id: piece.id,
        weight: Number(pieceData.weight || 1),
        length: Number(pieceData.length || 1),
        quantity: Number(piece.quantity || 1),
        plantId: pieceData.plantId,
        requiresEscort: pieceData.requiresEscort || false
      };
    }));
    
    // For each piece, convert plantId to plantCode (CO, BA, VM)
    for (const piece of enhancedPieces) {
      if (piece.plantId) {
        piece.plantId = await getPlantCode(piece.plantId);
      } else {
        piece.plantId = 'CO'; // Default to Córdoba
      }
    }
    
    // Calculate freight
    const result = await calculateFreight(
      enhancedPieces,
      Number(distanceKm),
      destinationCity || 'Unknown'
    );
    
    return jsonOK(result);
  } catch (error) {
    console.error('Error calculating freight:', error);
    return jsonError(error instanceof Error ? error.message : "Error interno al calcular el flete", 500);
  }
}