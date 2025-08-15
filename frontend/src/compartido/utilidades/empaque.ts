/**
 * Packing determinista: unidades por camión en función de peso, volumen y dimensiones/stacking
 */

export interface TruckType {
  max_payload_tn: number
  deck_length_m: number
  deck_width_m: number
  max_stack_height_m: number
  usable_volume_factor: number
}

export interface PieceGeom {
  length_m: number
  width_m: number
  height_m: number
  weight_tn: number
  volume_m3: number
}

export interface PackingRules {
  orientation: 'flat' | 'on_edge' | 'vertical' | 'custom'
  min_gap_m: number
  max_stack_layers: number
  layer_height_m?: number
}

function floorDiv(a: number, b: number): number { if (b <= 0) return 0; return Math.max(0, Math.floor(a / b)) }

export function unitsPerTruck(truck: TruckType, piece: PieceGeom, rules: PackingRules): number {
  const maxUnitsByWeight = Math.floor((truck.max_payload_tn || 0) / (piece.weight_tn || 1e-9))

  const usableVolume = (truck.deck_length_m * truck.deck_width_m * truck.max_stack_height_m) * (truck.usable_volume_factor || 1)
  const maxUnitsByVolume = Math.floor(usableVolume / (piece.volume_m3 || 1e-9))

  const deckL = truck.deck_length_m - (rules.min_gap_m || 0)
  const deckW = truck.deck_width_m - (rules.min_gap_m || 0)

  const perL = floorDiv(deckL, piece.length_m || 1e9)
  const perW = floorDiv(deckW, piece.width_m || 1e9)
  const layers = Math.min(rules.max_stack_layers || 1, floorDiv(truck.max_stack_height_m, rules.layer_height_m || piece.height_m || 1e9))
  const maxUnitsByDims = Math.max(0, perL * perW * Math.max(1, layers))

  const u = Math.min(
    Math.max(1, maxUnitsByWeight),
    Math.max(1, maxUnitsByVolume),
    Math.max(1, maxUnitsByDims)
  )
  return Math.max(1, u)
}


