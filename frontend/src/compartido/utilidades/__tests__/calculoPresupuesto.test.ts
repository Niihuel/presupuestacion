import { describe, it, expect } from 'vitest'
import {
  calcularPresupuesto,
  DEFAULT_INDICES,
  DEFAULT_TARIFAS,
  round,
  type PresupuestoEntrada,
  type CategoriaLargo
} from '../calculoPresupuesto'

function baseInput(overrides: Partial<PresupuestoEntrada> = {}): PresupuestoEntrada {
  return {
    fechaPreciosBase: '2025-01-01',
    indices: DEFAULT_INDICES,
    parametros: {
      porcentajeGG: 0.10,
      aforoToneladas: 26,
      habilitaTransporte: false,
      habilitaMontaje: false,
      distanciaKm: 0,
      categoriaLargo: '26m' as CategoriaLargo,
      viajesOverride: null,
      diasMontaje: 0,
      diasGruaAdicional: 0,
      kmTrasladoGrua: 0,
      usaGruaAdicional: false,
    },
    ajustesMateriales: {
      porcentajeComercial: 0,
      multiplicadorAdicional: 1,
    },
    tarifas: DEFAULT_TARIFAS,
    tarifarioTransporte: [],
    items: [],
    trabajosComplementarios: { TC1: [], TC2: [] },
    ...overrides as any,
  }
}

describe('Motor de cálculo - Casos mínimos', () => {
  it('Losa (ESPECIAL, M2)', () => {
    const input = baseInput({
      items: [{
        descripcion: 'Losa', um: 'M2', cantidad: 16, longitudM: 5, anchoM: 1.8,
        pesoPorUM_tn: 0.233, precioPorUM_$: 55.5, categoriaAjuste: 'ESPECIAL'
      }],
    })
    const res = calcularPresupuesto(input)
    const it = res.items[0]

    expect(it.medida).toBe(144) // 16*5*1.8
    expect(it.pesoTn).toBe(33.552) // 144*0.233
    expect(it.totalBasico).toBe(7992.00) // 144*55.5
    expect(it.indiceAplicado).toBe(DEFAULT_INDICES.especial)
    // 7,992.00 * 2316.15 = 18,510,670.8
    expect(it.totalActualizado).toBe(18510670.8)
    expect(res.materiales.subtotalMateriales).toBe(18510670.8)
  })

  it('Viga (GENERAL, MT)', () => {
    const input = baseInput({
      items: [{
        descripcion: 'Viga', um: 'MT', cantidad: 10, longitudM: 12.5,
        pesoPorUM_tn: 0.576, precioPorUM_$: 90, categoriaAjuste: 'GENERAL'
      }],
    })
    const res = calcularPresupuesto(input)
    const it = res.items[0]

    // medida = 10 * 12.5 = 125
    expect(it.medida).toBe(125)
    // peso = medida * 0.576 = 72.000
    expect(it.pesoTn).toBe(72.000)
    // totalBasico = 125 * 90 = 11250.00
    expect(it.totalBasico).toBe(11250.00)
    // indice general
    expect(it.indiceAplicado).toBe(DEFAULT_INDICES.general)
    // totalActualizado = 11250 * 2895.44
    expect(it.totalActualizado).toBe(round(11250 * DEFAULT_INDICES.general, 2))
  })

  it('UND con fallback kg/pieza', () => {
    const input = baseInput({
      items: [{
        descripcion: 'Anclaje', um: 'UND', cantidad: 8,
        weightKgPorPieza: 500, precioPorUM_$: 120, categoriaAjuste: 'GENERAL'
      }],
    })
    const res = calcularPresupuesto(input)
    const it = res.items[0]
    // peso = (8 * 500) / 1000 = 4.000 tn
    expect(it.pesoTn).toBe(4.000)
    // totalBasico = 8 * 120 = 960.00
    expect(it.totalBasico).toBe(960.00)
    // indice general
    expect(it.indiceAplicado).toBe(DEFAULT_INDICES.general)
    expect(it.totalActualizado).toBe(round(960 * DEFAULT_INDICES.general, 2))
  })
})

describe('Transporte/Montaje (smoke)', () => {
  it('Viajes CEILING, GG 10%, traslado grúa con factor', () => {
    const input = baseInput({
      parametros: {
        porcentajeGG: 0.10,
        aforoToneladas: 26,
        habilitaTransporte: true,
        habilitaMontaje: true,
        distanciaKm: 120,
        categoriaLargo: '26m',
        viajesOverride: null,
        diasMontaje: 1,
        diasGruaAdicional: 0,
        kmTrasladoGrua: 50,
        usaGruaAdicional: false,
      },
      tarifarioTransporte: [
        { distanciaKmTramo: 100, categoriaLargo: '26m', tarifaPorViaje: 800000 },
        { distanciaKmTramo: 150, categoriaLargo: '26m', tarifaPorViaje: 1000000 },
      ],
      items: [{ descripcion: 'X', um: 'UND', cantidad: 1, weightKgPorPieza: 30000, precioPorUM_$: 1, categoriaAjuste: 'GENERAL' }],
    })
    const res = calcularPresupuesto(input)
    // pesoTotalTransporte = 30 tn -> viajes = CEILING(30/26)=2
    expect(res.transporte.viajes).toBe(2)
    // tramo >=120 usa 150 => tarifa 1,000,000 -> base 2,000,000 GG 10% -> 2,200,000
    expect(res.transporte.tarifaSeleccionada).toBe(1000000)
    expect(res.transporte.importeTransporteBase).toBe(2000000)
    expect(res.transporte.ggTransporte).toBe(200000)
    expect(res.transporte.totalTransporte).toBe(2200000)

    // Montaje: tnAMontar=30; estandar=30*85381; porDia=1*4269062; gruaAdic=0; traslado=km*2*2625=50*2*2625
    const esperadoSubtotal = (30 * DEFAULT_TARIFAS.montajePorTon) + (1 * DEFAULT_TARIFAS.cuadrillaMasGruaDia) + (0) + (50 * 2 * DEFAULT_TARIFAS.trasladoGruaPorKm)
    const gg = Math.round((esperadoSubtotal * 0.10) * 100) / 100
    expect(res.montaje.subtotalMontaje).toBeCloseTo(esperadoSubtotal, 2)
    expect(res.montaje.ggMontaje).toBeCloseTo(gg, 2)
    expect(res.montaje.totalMontaje).toBeCloseTo(esperadoSubtotal + gg, 2)
  })
})


