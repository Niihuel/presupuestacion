import { prisma } from "@/lib/prisma";

export type BudgetPiece = {
  id: string;
  weight: number; // toneladas reales de la pieza
  length: number; // metros
  individual?: boolean; // requiere transporte individual
  maxStackable?: number; // máximo apilable para esta pieza en un camión
  specialHandling?: boolean; // manejo especial implica individual
};

export type TruckLoad = {
  type: "over12m" | "under12m";
  pieces: string[];
  realTons: number;
  falseTons: number;
  totalTons: number;
  cost: number;
};

export type FreightCalculation = {
  individualLoads: TruckLoad[];
  groupedLoads: TruckLoad[];
  totalRealTons: number;
  totalFalseTons: number;
  totalCost: number;
  optimization: {
    trucksUsed: number;
    avgUtilization: number; // promedio de (realTons / totalTons)
    savedByGrouping: number; // ahorro vs. enviar cada agrupable como individual
  };
};

export class FreightCalculatorService {
  // Capacidades por tipo (valores históricos FoxPro)
  private readonly TRUCK_CAPACITY = {
    over12m: { min: 24, max: 27 }, // > 12 m
    under12m: { min: 21, max: 25 }, // ≤ 12 m
  } as const;

  /**
   * Cálculo integral de flete con separación de cargas individuales,
   * bin-packing FFD para agrupables, toneladas falsas y costos.
   */
  async calculateFreight(
    pieces: BudgetPiece[],
    origin: "CBA" | "BSAS",
    distanceKm: number,
  ): Promise<FreightCalculation> {
    // 1) Separar piezas individuales según reglas críticas
    const individualPieces = pieces.filter((p) =>
      !!p.individual || !!p.specialHandling || (p.weight ?? 0) > 25 || (p.length ?? 0) > 12,
    );
    const groupablePieces = pieces.filter((p) => !individualPieces.includes(p));

    // 2) Calcular camiones para individuales
    const individualLoads: TruckLoad[] = [];
    for (const piece of individualPieces) {
      const isOver12m = (piece.length ?? 0) > 12;
      const cap = this.TRUCK_CAPACITY[isOver12m ? "over12m" : "under12m"];
      const realTons = piece.weight ?? 0;
      const minTons = Math.max(realTons, cap.min);
      const falseTons = Math.max(0, cap.min - realTons);
      const cost = await this.calculateTruckCost(distanceKm, isOver12m);
      individualLoads.push({
        type: isOver12m ? "over12m" : "under12m",
        pieces: [piece.id],
        realTons,
        falseTons,
        totalTons: minTons,
        cost,
      });
    }

    // 3) Optimizar agrupables (FFD modificado) y calcular costos
    const groupedLoads = await this.optimizeGrouping(groupablePieces, origin, distanceKm);

    // 4) Totales y métricas
    const totalRealTons = this.sumRealTons(individualLoads, groupedLoads);
    const totalFalseTons = this.sumFalseTons(individualLoads, groupedLoads);
    const totalCost = this.sumCosts(individualLoads, groupedLoads);
    const optimization = await this.calculateOptimization(
      groupablePieces,
      individualLoads,
      groupedLoads,
      distanceKm,
    );

    return { individualLoads, groupedLoads, totalRealTons, totalFalseTons, totalCost, optimization };
  }

  /**
   * Empaque por primera cabida decreciente (FFD) por tipo de camión.
   * Mantiene camiones separados para over12m y under12m.
   */
  private async optimizeGrouping(
    pieces: BudgetPiece[],
    _origin: string,
    distanceKm: number,
  ): Promise<TruckLoad[]> {
    const sorted = [...pieces].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
    const over: TruckLoad[] = [];
    const under: TruckLoad[] = [];

    for (const piece of sorted) {
      const isOver12m = (piece.length ?? 0) > 12;
      const cap = this.TRUCK_CAPACITY[isOver12m ? "over12m" : "under12m"];
      const trucks = isOver12m ? over : under;

      let placed = false;
      for (const t of trucks) {
        const maxStackable = piece.maxStackable ?? 10;
        if (
          t.totalTons + (piece.weight ?? 0) <= cap.max &&
          t.pieces.length < maxStackable
        ) {
          t.pieces.push(piece.id);
          t.realTons += (piece.weight ?? 0);
          t.totalTons += (piece.weight ?? 0);
          placed = true;
          break;
        }
      }

      if (!placed) {
        trucks.push({
          type: isOver12m ? "over12m" : "under12m",
          pieces: [piece.id],
          realTons: piece.weight ?? 0,
          falseTons: 0,
          totalTons: piece.weight ?? 0,
          cost: 0, // se completa luego
        });
      }
    }

    // Toneladas falsas para camiones incompletos y costo por camión
    for (const list of [over, under]) {
      for (const t of list) {
        const cap = this.TRUCK_CAPACITY[t.type];
        if (t.realTons < cap.min) {
          t.falseTons = cap.min - t.realTons;
          t.totalTons = cap.min;
        }
        t.cost = await this.calculateTruckCost(distanceKm, t.type === "over12m");
      }
    }

    return [...over, ...under];
  }

  private async calculateTruckCost(distanceKm: number, isOver12m: boolean): Promise<number> {
    const rate = await this.getRate(distanceKm);
    const perKm = isOver12m ? (rate?.rateOver12m ?? 0) : (rate?.rateUnder12m ?? 0);
    // Modelo de tarifa: costo = tarifa por km * distancia
    return perKm * distanceKm;
  }

  private async getRate(distanceKm: number) {
    const rate = await prisma.freightRate.findFirst({
      where: { kmFrom: { lte: Math.floor(distanceKm) }, kmTo: { gte: Math.ceil(distanceKm) } },
      orderBy: { effectiveDate: "desc" },
    });
    if (rate) return rate as any;
    // Fallback: la última tarifa vigente
    return prisma.freightRate.findFirst({ orderBy: { effectiveDate: "desc" } }) as any;
  }

  private sumRealTons(a: TruckLoad[], b: TruckLoad[]): number {
    return [...a, ...b].reduce((acc, t) => acc + (t.realTons || 0), 0);
  }

  private sumFalseTons(a: TruckLoad[], b: TruckLoad[]): number {
    return [...a, ...b].reduce((acc, t) => acc + (t.falseTons || 0), 0);
  }

  private sumCosts(a: TruckLoad[], b: TruckLoad[]): number {
    return [...a, ...b].reduce((acc, t) => acc + (t.cost || 0), 0);
  }

  private async calculateOptimization(
    groupable: BudgetPiece[],
    individualLoads: TruckLoad[],
    groupedLoads: TruckLoad[],
    distanceKm: number,
  ) {
    // Costo hipotético si todas las agrupables fueran individuales
    let hypothetical = 0;
    for (const p of groupable) {
      const isOver = (p.length ?? 0) > 12;
      const cap = this.TRUCK_CAPACITY[isOver ? "over12m" : "under12m"];
      const cost = await this.calculateTruckCost(distanceKm, isOver);
      // cada pieza usa al menos el mínimo de su tipo
      hypothetical += cost;
    }

    const groupedCost = groupedLoads.reduce((a, t) => a + t.cost, 0);
    const used = [...individualLoads, ...groupedLoads];
    const trucksUsed = used.length;
    const avgUtilization = trucksUsed
      ? used.reduce((a, t) => a + (t.realTons / (t.totalTons || 1)), 0) / trucksUsed
      : 0;
    const savedByGrouping = Math.max(0, hypothetical - groupedCost);
    return { trucksUsed, avgUtilization, savedByGrouping };
  }
}


