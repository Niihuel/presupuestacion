import { NextRequest, NextResponse } from 'next/server';
import { estimateMontageDays } from '@/lib/validations/budget-wizard';

// Tarifas de servicios de montaje
const MONTAGE_RATES = {
  crane: {
    under100: { daily: 35000, mobilization: 150 }, // por km
    '100to300': { daily: 45000, mobilization: 200 },
    over300: { daily: 60000, mobilization: 250 }
  },
  crew: {
    perPerson: 8500 // por día por persona
  },
  supervisor: {
    daily: 15000
  }
};

// Tarifas de trabajos complementarios
const ADDITIONAL_WORK_RATES = {
  waterproofing: {
    standard: 450, // por m²
    premium: 750
  },
  neoprenes: {
    unit: 1200
  },
  specialWelding: {
    perMeter: 2800
  },
  jointFilling: {
    perMeter: 850
  },
  fireproofPaint: {
    perM2: 1250
  }
};

// Tarifas de equipamiento especial
const EQUIPMENT_RATES = {
  scaffolding: {
    daily: 5500
  },
  liftingEquipment: {
    standard: 12000,
    heavy: 25000
  },
  generators: {
    daily: 3500
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      pieceCount, 
      totalWeight,
      maxHeight,
      projectArea,
      complexity = 'medium',
      hasEnergyOnSite = true,
      mobilizationDistance = 0
    } = body;

    // Estimar días de montaje
    const estimatedDays = estimateMontageDays(pieceCount, complexity);

    // Calcular servicios de montaje
    const montageServices = {
      crane: {
        enabled: totalWeight > 50, // Grúa necesaria para más de 50 ton
        tonnageCategory: 
          totalWeight < 100 ? 'under100' :
          totalWeight <= 300 ? '100to300' : 'over300',
        days: estimatedDays,
        mobilizationKm: mobilizationDistance,
        cost: 0
      },
      crew: {
        enabled: true,
        size: projectArea > 500 ? 6 : 4,
        days: estimatedDays,
        cost: 0
      },
      supervisor: {
        enabled: complexity !== 'simple',
        days: estimatedDays,
        cost: 0
      }
    };

    // Calcular costos de montaje
    if (montageServices.crane.enabled) {
      const craneRate = MONTAGE_RATES.crane[montageServices.crane.tonnageCategory as keyof typeof MONTAGE_RATES.crane];
      montageServices.crane.cost = 
        (craneRate.daily * montageServices.crane.days) +
        (craneRate.mobilization * montageServices.crane.mobilizationKm);
    }

    montageServices.crew.cost = 
      MONTAGE_RATES.crew.perPerson * montageServices.crew.size * montageServices.crew.days;

    if (montageServices.supervisor.enabled) {
      montageServices.supervisor.cost = 
        MONTAGE_RATES.supervisor.daily * montageServices.supervisor.days;
    }

    // Sugerir trabajos adicionales basados en el proyecto
    const suggestedAdditionals = {
      waterproofing: {
        enabled: false,
        area: projectArea * 0.8, // 80% del área típicamente
        type: 'standard' as const,
        cost: 0
      },
      neoprenes: {
        enabled: pieceCount > 20,
        quantity: Math.ceil(pieceCount * 1.5), // 1.5 neoprenos por pieza en promedio
        unitPrice: ADDITIONAL_WORK_RATES.neoprenes.unit,
        cost: 0
      },
      specialWelding: {
        enabled: complexity === 'complex',
        meters: pieceCount * 2, // Estimación
        cost: 0
      },
      jointFilling: {
        enabled: true,
        meters: pieceCount * 3, // Estimación de juntas
        cost: 0
      },
      fireproofPaint: {
        enabled: false,
        area: 0,
        cost: 0
      }
    };

    // Calcular costos de adicionales
    if (suggestedAdditionals.neoprenes.enabled) {
      suggestedAdditionals.neoprenes.cost = 
        suggestedAdditionals.neoprenes.quantity * suggestedAdditionals.neoprenes.unitPrice;
    }

    if (suggestedAdditionals.specialWelding.enabled) {
      suggestedAdditionals.specialWelding.cost = 
        suggestedAdditionals.specialWelding.meters * ADDITIONAL_WORK_RATES.specialWelding.perMeter;
    }

    if (suggestedAdditionals.jointFilling.enabled) {
      suggestedAdditionals.jointFilling.cost = 
        suggestedAdditionals.jointFilling.meters * ADDITIONAL_WORK_RATES.jointFilling.perMeter;
    }

    // Sugerir equipamiento especial
    const specialEquipment = {
      scaffolding: {
        enabled: maxHeight > 6,
        days: estimatedDays,
        cost: maxHeight > 6 ? EQUIPMENT_RATES.scaffolding.daily * estimatedDays : 0
      },
      liftingEquipment: {
        enabled: totalWeight > 100,
        type: totalWeight > 200 ? 'heavy' : 'standard',
        cost: totalWeight > 100 ? 
          (totalWeight > 200 ? EQUIPMENT_RATES.liftingEquipment.heavy : EQUIPMENT_RATES.liftingEquipment.standard) : 0
      },
      generators: {
        enabled: !hasEnergyOnSite,
        quantity: !hasEnergyOnSite ? Math.ceil(projectArea / 500) : 0,
        days: estimatedDays,
        cost: !hasEnergyOnSite ? 
          EQUIPMENT_RATES.generators.daily * estimatedDays * Math.ceil(projectArea / 500) : 0
      }
    };

    // Calcular totales
    const totalMontageCost = 
      montageServices.crane.cost +
      montageServices.crew.cost +
      montageServices.supervisor.cost;

    const totalAdditionalsCost = 
      Object.values(suggestedAdditionals).reduce((sum, item) => sum + item.cost, 0) +
      Object.values(specialEquipment).reduce((sum, item) => sum + item.cost, 0);

    // Generar recomendaciones
    const recommendations = [];
    
    if (complexity === 'complex' && !montageServices.supervisor.enabled) {
      recommendations.push({
        type: 'warning',
        message: 'Se recomienda supervisor para obras complejas'
      });
    }

    if (maxHeight > 10 && !specialEquipment.scaffolding.enabled) {
      recommendations.push({
        type: 'safety',
        message: 'Altura superior a 10m requiere andamios especiales'
      });
    }

    if (totalWeight > 300) {
      recommendations.push({
        type: 'info',
        message: 'Obra de gran envergadura. Considere plan de seguridad especial.'
      });
    }

    return NextResponse.json({
      estimatedDays,
      montageServices,
      additionalWork: suggestedAdditionals,
      specialEquipment,
      totalMontageCost,
      totalAdditionalsCost,
      totalCost: totalMontageCost + totalAdditionalsCost,
      recommendations,
      breakdown: {
        montage: {
          crane: montageServices.crane.cost,
          crew: montageServices.crew.cost,
          supervisor: montageServices.supervisor.cost
        },
        additionals: {
          work: Object.values(suggestedAdditionals).reduce((sum, item) => sum + item.cost, 0),
          equipment: Object.values(specialEquipment).reduce((sum, item) => sum + item.cost, 0)
        }
      }
    });
  } catch (error) {
    console.error('Error calculating additionals:', error);
    return NextResponse.json(
      { error: 'Error al calcular adicionales' },
      { status: 500 }
    );
  }
}
