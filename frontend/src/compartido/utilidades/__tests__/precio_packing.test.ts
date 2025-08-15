import { describe, it, expect } from 'vitest'
import { precioBasePorUM } from '../precioBasePorUM'
import { unitsPerTruck } from '../packing'

describe('precioBasePorUM', () => {
  it('Losa M2 con BOM + Proceso', () => {
    const bom = [
      { materialId: 1, unit: 'm3', quantityPerUM: 0.18 }, // hormigón
      { materialId: 2, unit: 'kg', quantityPerUM: 25 }     // acero
    ]
    const prices = [
      { materialId: 1, price: 90000 }, // $/m3
      { materialId: 2, price: 2000 }   // $/kg
    ]
    const process = {
      energia_curado_tn: 15000,
      gg_fabrica_tn: 12000,
      gg_empresa_tn: 8000,
      utilidad_tn: 10000,
      ingenieria_tn: 5000,
      precio_hora: 3000,
      horas_por_tn_acero: 70,
      horas_por_m3_hormigon: 25
    }
    const tech = {
      um: 'M2' as const,
      pesoTnPorUM: 0.233,
      volumenM3PorUM: 0.18,
      kgAceroPorUM: 25
    }
    const r = precioBasePorUM(bom, prices, process, tech)
    expect(r.total).toBeGreaterThan(0)
  })
})

describe('unitsPerTruck (packing)', () => {
  it('Calcula por límite de dimensiones y peso', () => {
    const truck = { max_payload_tn: 26, deck_length_m: 12.5, deck_width_m: 2.5, max_stack_height_m: 2.6, usable_volume_factor: 0.9 }
    const piece = { length_m: 12, width_m: 0.5, height_m: 0.5, weight_tn: 1.2, volume_m3: 3.0 }
    const rules = { orientation: 'flat' as const, min_gap_m: 0.1, max_stack_layers: 3, layer_height_m: 0.5 }
    const u = unitsPerTruck(truck, piece, rules)
    expect(u).toBeGreaterThan(0)
  })
})


