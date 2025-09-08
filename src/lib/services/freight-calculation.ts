/**
 * Freight Calculation Service
 * 
 * This service implements the detailed freight calculation logic for PRETENSA's budget system.
 * It optimizes truck loading and calculates costs based on distance, piece length, and minimum billable tonnage.
 */

import { prisma } from "@/lib/prisma";

// Constants
const PLANT_CODES = {
  CORDOBA: "CO",
  BUENOS_AIRES: "BA",
  VILLA_MERCEDES: "VM"
};

// Types
interface FreightPiece {
  id: string;
  weight: number;     // in tons
  length: number;     // in meters
  quantity: number;   // number of pieces
  plantId: string;    // origin plant
  requiresEscort: boolean;
}

interface TruckGroup {
  plantCode: string;          // CO, BA, VM
  isLongPiece: boolean;       // true if > 12m
  pieces: FreightPiece[];
  totalWeight: number;
  maxWeight: number;
  minBillableWeight: number;
}

interface OptimizedTruck {
  pieces: FreightPiece[];
  realWeight: number;         // Actual weight of pieces
  falseWeight: number;        // Additional weight to reach minimum billable
  totalWeight: number;        // realWeight + falseWeight
  maxCapacity: number;        // Truck capacity in tons
  minCapacity: number;        // Minimum billable tons
  over12m: boolean;           // Is for pieces > 12m
  plantCode: string;          // Origin plant
  requiresEscort: boolean;    // Requires escort vehicle
  pieceCount: number;         // Total pieces count
}

interface FreightCalculationResult {
  trucks: OptimizedTruck[];
  totalRealWeight: number;
  totalFalseWeight: number;
  totalWeight: number;
  totalCost: number;
  distanceKm: number;
  costDetails: {
    plantCode: string;
    truckCount: number;
    totalWeight: number;
    rate: number;
    cost: number;
  }[];
}

/**
 * Calculate freight cost for a given set of pieces and destination
 * @param pieces List of pieces to transport
 * @param distanceKm Distance to destination in kilometers
 * @param destinationCity Destination city name
 */
export async function calculateFreight(
  pieces: FreightPiece[],
  distanceKm: number,
  destinationCity: string
): Promise<FreightCalculationResult> {
  // Step 1: Group pieces by plant and length (≤12m or >12m)
  const truckGroups = groupPiecesByPlantAndLength(pieces);
  
  // Step 2: Optimize truck loading for each group
  const optimizedTrucks = await optimizeTruckLoading(truckGroups);
  
  // Step 3: Calculate costs based on freight rates
  const calculationResult = await calculateFreightCost(optimizedTrucks, distanceKm, destinationCity);
  
  return calculationResult;
}

/**
 * Group pieces by plant origin and length (long or short)
 */
function groupPiecesByPlantAndLength(pieces: FreightPiece[]): TruckGroup[] {
  const groups: Record<string, TruckGroup> = {};
  
  // Group pieces by plant origin and length
  pieces.forEach(piece => {
    // For each piece quantity, create a separate piece entry
    for (let i = 0; i < piece.quantity; i++) {
      const plantCode = piece.plantId; // This should be mapped to CO, BA, VM in real implementation
      let lengthCategory;
      
      if (piece.length <= 12) {
        lengthCategory = 'standard'; // <= 12m
      } else if (piece.length <= 21.5) {
        lengthCategory = 'medium';   // > 12m and <= 21.5m
      } else {
        lengthCategory = 'extended'; // > 21.5m
      }
      
      const key = `${plantCode}_${lengthCategory}`;
      
      if (!groups[key]) {
        let maxWeight, minBillableWeight;
        
        switch(lengthCategory) {
          case 'medium':
            maxWeight = 27;
            minBillableWeight = 24;
            break;
          case 'extended':
            maxWeight = 36.6;
            minBillableWeight = 26;
            break;
          default: // standard
            maxWeight = 25;
            minBillableWeight = 21;
        }
        
        groups[key] = {
          plantCode,
          isLongPiece: lengthCategory !== 'standard',
          pieces: [],
          totalWeight: 0,
          maxWeight,
          minBillableWeight
        };
      }
      
      // Add a single piece (accounting for quantity)
      const singlePiece = {
        ...piece,
        quantity: 1  // We've expanded the quantity into individual pieces
      };
      
      groups[key].pieces.push(singlePiece);
      groups[key].totalWeight += piece.weight;
    }
  });
  
  return Object.values(groups);
}

/**
 * Optimize truck loading based on piece groups
 */
async function optimizeTruckLoading(groups: TruckGroup[]): Promise<OptimizedTruck[]> {
  const optimizedTrucks: OptimizedTruck[] = [];
  
  // Get truck configurations from database
  const truckConfigs = await prisma.truck.findMany({
    where: { active: true },
    orderBy: { truckType: 'asc' }  // Order by type to prioritize standard trucks
  });
  
  // Create a mapping of truck types for quick access
  const truckTypeMap: Record<string, any> = {};
  truckConfigs.forEach(truck => {
    if (truck.truckType === 'STANDARD' || truck.truckType === 'MEDIUM' || truck.truckType === 'EXTENDED') {
      truckTypeMap[truck.truckType] = truck;
    }
  });
  
  // Process each group
  for (const group of groups) {
    // Sort pieces by weight in descending order for better bin packing
    const sortedPieces = [...group.pieces].sort((a, b) => b.weight - a.weight);
    
    // Select appropriate truck type based on piece length
    let truckType;
    if (group.isLongPiece && Math.max(...group.pieces.map(p => p.length)) > 21.5) {
      truckType = truckTypeMap['EXTENDED']; // For pieces > 21.5m
    } else if (group.isLongPiece && Math.max(...group.pieces.map(p => p.length)) > 12) {
      truckType = truckTypeMap['MEDIUM']; // For pieces > 12m and <= 21.5m
    } else {
      truckType = truckTypeMap['STANDARD']; // For pieces <= 12m
    }
    
    if (!truckType) {
      // Fallback to default values if no truck config is found
      let defaultCapacity = 25;
      let defaultMinBillable = 21;
      
      if (group.isLongPiece) {
        const maxPieceLength = Math.max(...group.pieces.map(p => p.length));
        if (maxPieceLength > 21.5) {
          defaultCapacity = 36.6;
          defaultMinBillable = 26;
        } else {
          defaultCapacity = 27;
          defaultMinBillable = 24;
        }
      }
      
      truckType = {
        capacityTons: defaultCapacity,
        minBillableTons: defaultMinBillable
      };
    }
    
    const maxCapacity = truckType.capacityTons || (group.isLongPiece ? 27 : 25);
    const minBillable = truckType.minBillableTons || (group.isLongPiece ? 24 : 21);
    
    // Simple First-Fit Decreasing bin packing algorithm
    let currentTruck: FreightPiece[] = [];
    let currentWeight = 0;
    let requiresEscort = false;
    
    for (const piece of sortedPieces) {
      // If piece is too heavy for a single truck, it gets its own truck
      if (piece.weight > maxCapacity) {
        optimizedTrucks.push({
          pieces: [piece],
          realWeight: piece.weight,
          falseWeight: 0, // No false weight for pieces exceeding max capacity
          totalWeight: piece.weight,
          maxCapacity,
          minCapacity: minBillable,
          over12m: group.isLongPiece,
          plantCode: group.plantCode,
          requiresEscort: piece.requiresEscort,
          pieceCount: 1
        });
        continue;
      }
      
      // If piece would exceed current truck capacity, start a new truck
      if (currentWeight + piece.weight > maxCapacity) {
        // Calculate false weight if real weight is below minimum billable
        const falseWeight = currentWeight < minBillable ? minBillable - currentWeight : 0;
        
        optimizedTrucks.push({
          pieces: currentTruck,
          realWeight: currentWeight,
          falseWeight,
          totalWeight: Math.max(currentWeight, minBillable),
          maxCapacity,
          minCapacity: minBillable,
          over12m: group.isLongPiece,
          plantCode: group.plantCode,
          requiresEscort,
          pieceCount: currentTruck.length
        });
        
        // Start a new truck
        currentTruck = [piece];
        currentWeight = piece.weight;
        requiresEscort = piece.requiresEscort;
      } else {
        // Add piece to current truck
        currentTruck.push(piece);
        currentWeight += piece.weight;
        requiresEscort = requiresEscort || piece.requiresEscort;
      }
    }
    
    // Add the last truck if not empty
    if (currentTruck.length > 0) {
      const falseWeight = currentWeight < minBillable ? minBillable - currentWeight : 0;
      
      optimizedTrucks.push({
        pieces: currentTruck,
        realWeight: currentWeight,
        falseWeight,
        totalWeight: Math.max(currentWeight, minBillable),
        maxCapacity,
        minCapacity: minBillable,
        over12m: group.isLongPiece,
        plantCode: group.plantCode,
        requiresEscort,
        pieceCount: currentTruck.length
      });
    }
  }
  
  return optimizedTrucks;
}

/**
 * Calculate the freight cost based on optimized truck loading and distance
 */
async function calculateFreightCost(
  trucks: OptimizedTruck[], 
  distanceKm: number,
  destinationCity: string
): Promise<FreightCalculationResult> {
  // Find applicable freight rates based on distance
  const freightRates = await prisma.freightRate.findMany({
    where: {
      isActive: true,
      kmFrom: { lte: distanceKm },
      kmTo: { gte: distanceKm }
    }
  });
  
  const costDetails: any[] = [];
  let totalCost = 0;
  let totalRealWeight = 0;
  let totalFalseWeight = 0;
  
  // Group trucks by plant and over12m status for cost calculation
  const truckGroups: Record<string, OptimizedTruck[]> = {};
  
  trucks.forEach(truck => {
    const key = `${truck.plantCode}_${truck.over12m ? 'long' : 'short'}`;
    if (!truckGroups[key]) {
      truckGroups[key] = [];
    }
    truckGroups[key].push(truck);
    
    totalRealWeight += truck.realWeight;
    totalFalseWeight += truck.falseWeight;
  });
  
  // Calculate cost for each group
  for (const [key, groupTrucks] of Object.entries(truckGroups)) {
    const [plantCode, sizeType] = key.split('_');
    const isLongPiece = sizeType === 'long';
    
    // Find rate for this plant and distance
    const rate = freightRates.find(r => r.origin === plantCode);
    
    if (!rate) {
      console.warn(`No freight rate found for plant ${plantCode} and distance ${distanceKm}km`);
      continue;
    }
    
    // Calculate group total weight (real + false)
    const groupTotalWeight = groupTrucks.reduce((sum, truck) => sum + truck.totalWeight, 0);
    
    // Apply appropriate rate based on piece length
    const rateValue = isLongPiece ? rate.rateOver12m : rate.rateUnder12m;
    const groupCost = groupTotalWeight * rateValue;
    
    costDetails.push({
      plantCode,
      truckCount: groupTrucks.length,
      totalWeight: groupTotalWeight,
      rate: rateValue,
      cost: groupCost
    });
    
    totalCost += groupCost;
  }
  
  return {
    trucks,
    totalRealWeight,
    totalFalseWeight,
    totalWeight: totalRealWeight + totalFalseWeight,
    totalCost,
    distanceKm,
    costDetails
  };
}

/**
 * Get the plant code (CO, BA, VM) from plant ID
 */
export async function getPlantCode(plantId: string): Promise<string> {
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    select: { name: true, location: true }
  });
  
  if (!plant) return PLANT_CODES.CORDOBA; // Default to Córdoba
  
  // Logic to determine plant code based on name or location
  const name = plant.name.toLowerCase();
  if (name.includes('córdoba') || name.includes('cordoba')) {
    return PLANT_CODES.CORDOBA;
  } else if (name.includes('buenos aires')) {
    return PLANT_CODES.BUENOS_AIRES;
  } else if (name.includes('villa') && (name.includes('mercedes') || name.includes('maría') || name.includes('maria'))) {
    return PLANT_CODES.VILLA_MERCEDES;
  }
  
  // Fallback to Córdoba if plant code can't be determined
  return PLANT_CODES.CORDOBA;
}