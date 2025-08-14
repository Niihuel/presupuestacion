/**
 * Cálculo de precio de pieza por insumos (BOM) + Proceso
 * Puro y testeable. No hace I/O. Redondeos a 2 decimales en salida.
 */

export type UnidadMotor = 'UND' | 'MT' | 'M2'

export interface BOMItem {
  materialId: number
  materialName?: string
  unit: string // kg, m3, m2, m, und, etc.
  quantityPerUM: number // consumo por UM de pieza
  scrapPercentage?: number // 0-100
}

export interface MaterialPriceIndex {
  materialId: number
  price: number // precio vigente para el mes/zone
}

export interface ProcessParameters {
  energia_curado_tn: number
  gg_fabrica_tn: number
  gg_empresa_tn: number
  utilidad_tn: number
  ingenieria_tn: number
  precio_hora: number
  horas_por_tn_acero: number
  horas_por_m3_hormigon: number
}

export interface PieceTechData {
  um: UnidadMotor
  pesoTnPorUM?: number // tn/UM (preferente cuando hay MT/M2)
  kgAceroPorUM?: number
  volumenM3PorUM?: number
}

export interface PrecioBaseResult {
  materiales: number
  proceso: {
    porTn: number
    manoObraHormigon: number
    manoObraAcero: number
  }
  total: number
  estimado: boolean
}

export function round2(n: number): number { return Math.round(n * 100) / 100 }

export function precioBasePorUM(
  bom: BOMItem[],
  prices: MaterialPriceIndex[],
  process: ProcessParameters,
  tech: PieceTechData,
  { allowFallback = true, familyAlpha = 0 }: { allowFallback?: boolean; familyAlpha?: number } = {}
): PrecioBaseResult {
  const priceMap = new Map<number, number>(prices.map(p => [p.materialId, p.price]))

  const hasBOM = Array.isArray(bom) && bom.length > 0
  let materiales = 0
  if (hasBOM) {
    materiales = bom.reduce((acc, it) => {
      const qty = (it.quantityPerUM || 0) * (1 + (Number(it.scrapPercentage || 0) / 100))
      const price = priceMap.get(it.materialId) || 0
      return acc + qty * price
    }, 0)
  } else {
    materiales = (allowFallback ? familyAlpha : 0)
  }

  const pesoTn = tech.pesoTnPorUM || 0
  const porTn = (
    (process.energia_curado_tn || 0) +
    (process.gg_fabrica_tn || 0) +
    (process.gg_empresa_tn || 0) +
    (process.utilidad_tn || 0) +
    (process.ingenieria_tn || 0)
  ) * pesoTn

  const manoObraHormigon = (process.horas_por_m3_hormigon || 0) * (process.precio_hora || 0) * (tech.volumenM3PorUM || 0)
  const manoObraAcero = (process.horas_por_tn_acero || 0) * (process.precio_hora || 0) * ((tech.kgAceroPorUM || 0) / 1000)

  const proceso = { porTn: round2(porTn), manoObraHormigon: round2(manoObraHormigon), manoObraAcero: round2(manoObraAcero) }
  const total = round2(materiales) + proceso.porTn + proceso.manoObraHormigon + proceso.manoObraAcero

  return {
    materiales: round2(materiales),
    proceso,
    total: round2(total),
    estimado: !hasBOM
  }
}


