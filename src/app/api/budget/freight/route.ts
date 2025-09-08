import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  TRUCK_CAPACITY, 
  LEGACY_TRUCK_CAPACITY,
  getFreightRate, 
  calculateFalseTons 
} from '@/lib/validations/budget-wizard';

interface Piece {
  id: string;
  name: string;
  weight: number;
  length: number;
  quantity: number;
  individualTransport?: boolean;
  requiresEscort?: boolean;
  piecesPerTruck?: number;
}

interface Truck {
  truckNumber: number;
  pieces: Piece[];
  realWeight: number;
  falseWeight: number;
  maxCapacity: number;
  pieceCount: number;
  over12m: boolean;
  truckType: 'standard' | 'medium' | 'extended';
  requiresEscort: boolean;
  cost: number;
}

// Algoritmo Bin Packing para optimización de carga
function binPackingOptimization(pieces: Piece[]): Truck[] {
  const trucks: Truck[] = [];
  let truckNumber = 1;

  // Separar piezas individuales y agrupables
  const individualPieces = pieces.filter(p => 
    p.weight > 25 || 
    p.length > 12 || 
    p.individualTransport || 
    p.requiresEscort
  );

  const groupablePieces = pieces.filter(p => 
    p.weight <= 25 && 
    p.length <= 12 && 
    !p.individualTransport && 
    !p.requiresEscort
  );

  // Procesar piezas individuales
  individualPieces.forEach(piece => {
    let truckType: 'standard' | 'medium' | 'extended';
    const over12m = piece.length > 12;
    
    if (piece.length > 21.5) {
      truckType = 'extended';
    } else if (piece.length > 12) {
      truckType = 'medium';
    } else {
      truckType = 'standard';
    }
    
    const capacity = TRUCK_CAPACITY[truckType];
    
    // Cada pieza individual en su propio camión
    for (let i = 0; i < piece.quantity; i++) {
      const realWeight = piece.weight;
      const falseWeight = calculateFalseTons(realWeight, truckType);
      
      trucks.push({
        truckNumber: truckNumber++,
        pieces: [{...piece, quantity: 1}],
        realWeight,
        falseWeight,
        maxCapacity: capacity.max,
        pieceCount: 1,
        over12m,
        truckType,
        requiresEscort: piece.requiresEscort || false,
        cost: 0 // Se calculará después con la distancia
      });
    }
  });

  // Procesar piezas agrupables con bin packing
  // Ordenar por peso descendente para mejor empaquetado
  const sortedGroupable = [...groupablePieces].sort((a, b) => b.weight - a.weight);
  
  let currentTruck: Truck | null = null;
  
  for (const piece of sortedGroupable) {
    const over12m = piece.length > 12;
    const capacity = over12m ? TRUCK_CAPACITY.over12m : TRUCK_CAPACITY.under12m;
    const maxPiecesPerTruck = piece.piecesPerTruck || 10; // Límite de piezas por camión
    
    for (let i = 0; i < piece.quantity; i++) {
      // Buscar camión existente con espacio
      let placed = false;
      
      for (const truck of trucks) {
        // Verificar compatibilidad
        if (truck.over12m !== over12m) continue;
        if (truck.requiresEscort !== (piece.requiresEscort || false)) continue;
        if (truck.pieceCount >= maxPiecesPerTruck) continue;
        if (truck.realWeight + piece.weight > capacity.max) continue;
        
        // Agregar pieza al camión
        const existingPiece = truck.pieces.find(p => p.id === piece.id);
        if (existingPiece) {
          existingPiece.quantity++;
        } else {
          truck.pieces.push({...piece, quantity: 1});
        }
        truck.realWeight += piece.weight;
        truck.pieceCount++;
        placed = true;
        break;
      }
      
      // Si no se pudo colocar, crear nuevo camión
      if (!placed) {
        const newTruck: Truck = {
          truckNumber: truckNumber++,
          pieces: [{...piece, quantity: 1}],
          realWeight: piece.weight,
          falseWeight: 0,
          maxCapacity: capacity.max,
          pieceCount: 1,
          over12m,
          requiresEscort: piece.requiresEscort || false,
          cost: 0
        };
        trucks.push(newTruck);
      }
    }
  }

  // Calcular toneladas falsas para todos los camiones
  trucks.forEach(truck => {
    truck.falseWeight = calculateFalseTons(truck.realWeight, truck.over12m);
  });

  return trucks;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pieces, billedDistance, optimizationMethod = 'binpacking' } = body;

    if (!pieces || pieces.length === 0) {
      return NextResponse.json(
        { error: 'No hay piezas para calcular flete' },
        { status: 400 }
      );
    }

    if (!billedDistance || billedDistance <= 0) {
      return NextResponse.json(
        { error: 'Distancia inválida' },
        { status: 400 }
      );
    }

    // Optimizar distribución de piezas en camiones
    let trucks: Truck[];
    
    switch (optimizationMethod) {
      case 'binpacking':
      default:
        trucks = binPackingOptimization(pieces);
        break;
      // Aquí se pueden agregar otros métodos de optimización
    }

    // Calcular costos para cada camión
    trucks.forEach(truck => {
      const rate = getFreightRate(billedDistance, truck.over12m);
      const totalWeight = truck.realWeight + truck.falseWeight;
      truck.cost = totalWeight * rate * billedDistance;
    });

    // Calcular totales
    const totalRealWeight = trucks.reduce((sum, t) => sum + t.realWeight, 0);
    const totalFalseWeight = trucks.reduce((sum, t) => sum + t.falseWeight, 0);
    const totalFreightCost = trucks.reduce((sum, t) => sum + t.cost, 0);

    // Análisis de eficiencia
    const avgUtilization = trucks.map(t => 
      (t.realWeight / t.maxCapacity) * 100
    ).reduce((sum, u) => sum + u, 0) / trucks.length;

    const warnings = [];
    
    // Alertas de toneladas falsas
    if (totalFalseWeight > 0) {
      warnings.push({
        type: 'info',
        message: `Se facturarán ${totalFalseWeight.toFixed(2)} toneladas falsas (mínimo de carga no alcanzado)`
      });
    }

    // Alerta de baja utilización
    if (avgUtilization < 70) {
      warnings.push({
        type: 'warning',
        message: `Utilización promedio de camiones: ${avgUtilization.toFixed(1)}%. Considere consolidar cargas.`
      });
    }

    // Alerta de muchos camiones
    if (trucks.length > 10) {
      warnings.push({
        type: 'info',
        message: `Se requieren ${trucks.length} camiones. Considere programar entregas parciales.`
      });
    }

    return NextResponse.json({
      trucks,
      totalRealWeight,
      totalFalseWeight,
      totalFreightCost,
      trucksRequired: trucks.length,
      avgUtilization,
      warnings,
      breakdown: {
        individualTrucks: trucks.filter(t => t.pieceCount === 1).length,
        groupedTrucks: trucks.filter(t => t.pieceCount > 1).length,
        escortRequired: trucks.filter(t => t.requiresEscort).length,
        over12mTrucks: trucks.filter(t => t.over12m).length
      }
    });
  } catch (error) {
    console.error('Error calculating freight:', error);
    return NextResponse.json(
      { error: 'Error al calcular flete' },
      { status: 500 }
    );
  }
}
