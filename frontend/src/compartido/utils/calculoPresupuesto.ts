/**
 * Motor de Cálculo de Presupuestos – Estructuras Pretensa & Paschini
 *
 * Puro, determinista, trazable, parametrizable y testeable.
 * Unidades: ARS ($), m, m², tn (1 tn = 1000 kg)
 *
 * Reglas clave:
 * - Cálculo interno en double/float; redondear solo en la salida
 * - Redondeos de salida: $ a 2 decimales; tn a 3 decimales; viajes CEILING
 * - Validaciones duras con paths de error
 */

// =====================
// Tipos de dominio
// =====================

export type UM = 'UND' | 'MT' | 'M2'
export type CategoriaAjuste = 'GENERAL' | 'ESPECIAL' // ESPECIAL = Entrepiso/Placa/Pretensado
export type CategoriaLargo = '13_5m' | '16m' | '26m' | '30m' | '>30m'

export interface Indices {
  general: number
  especial: number
}

export interface Parametros {
  porcentajeGG: number
  aforoToneladas: number
  habilitaTransporte: boolean
  habilitaMontaje: boolean
  distanciaKm: number
  categoriaLargo: CategoriaLargo
  viajesOverride?: number | null
  diasMontaje: number
  diasGruaAdicional: number
  kmTrasladoGrua: number
  usaGruaAdicional: boolean
}

export interface Tarifas {
  montajePorTon: number
  cuadrillaMasGruaDia: number
  gruaAdicionalDia: number
  trasladoGruaPorKm: number
}

export interface TarifaTransporte {
  distanciaKmTramo: number
  categoriaLargo: CategoriaLargo
  tarifaPorViaje: number
}

export interface ItemMaterial {
  descripcion: string
  um: UM
  cantidad: number
  longitudM?: number
  anchoM?: number
  pesoPorUM_tn?: number
  weightKgPorPieza?: number
  precioPorUM_$: number
  categoriaAjuste: CategoriaAjuste
}

export interface TC_Renglon {
  descripcion: string
  um: UM
  cantidad: number
  longitudM?: number
  anchoM?: number
  precioPorUM_$: number
}

export interface TrabajosComplementarios {
  TC1: TC_Renglon[]
  TC2: TC_Renglon[]
}

export interface PresupuestoEntrada {
  fechaPreciosBase: string // 'YYYY-MM-DD'
  indices: Indices
  parametros: Parametros
  ajustesMateriales: {
    porcentajeComercial: number // ej. -0.20
    multiplicadorAdicional: number // ej. 1.00
  }
  tarifas: Tarifas
  tarifarioTransporte: TarifaTransporte[]
  items: ItemMaterial[]
  trabajosComplementarios: TrabajosComplementarios
}

export interface PresupuestoSalida {
  items: Array<ItemMaterial & {
    medida: number
    pesoTn: number
    totalBasico: number
    indiceAplicado: number
    totalActualizado: number
  }>
  materiales: {
    subtotalMateriales: number
    subtotalAjusteComercial: number
    subtotalMaterialesFinal: number
  }
  tc1: { subtotal: number; gg: number; total: number }
  transporte: {
    habilitado: boolean
    pesoTotalTransporte: number
    viajes: number
    tarifaSeleccionada: number
    importeTransporteBase: number
    ggTransporte: number
    totalTransporte: number
  }
  montaje: {
    habilitado: boolean
    trasladoGrua_$: number
    subtotalMontaje: number
    ggMontaje: number
    totalMontaje: number
  }
  totales: {
    totalMateriales: number
    totalPretensa: number
    totalGeneralPretensa: number
  }
}

// =====================
// Utilitarios
// =====================

export function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0)
}

function isNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n as number)
}

export function req<T>(value: T | undefined, path: string): T {
  if (value === undefined || value === null) {
    throw validationError(`${path}`, 'required')
  }
  return value
}

function validationError(path: string, code: string, details?: string) {
  const err = new Error(`Validación fallida en ${path} (${code}${details ? `: ${details}` : ''})`)
  ;(err as any).path = path
  ;(err as any).code = code
  return err
}

function assertPositive(name: string, value: number, strict = false) {
  if (!isNum(value)) throw validationError(name, 'type:number')
  if (strict ? value <= 0 : value < 0) throw validationError(name, strict ? '> 0' : '>= 0')
}

export function assertInputs(input: PresupuestoEntrada): void {
  // Indices
  assertPositive('indices.general', input.indices?.general, true)
  assertPositive('indices.especial', input.indices?.especial, true)

  // Parametros
  assertPositive('parametros.porcentajeGG', input.parametros?.porcentajeGG, false)
  assertPositive('parametros.aforoToneladas', input.parametros?.aforoToneladas, true)
  assertPositive('parametros.distanciaKm', input.parametros?.distanciaKm, false)
  assertPositive('parametros.diasMontaje', input.parametros?.diasMontaje, false)
  assertPositive('parametros.diasGruaAdicional', input.parametros?.diasGruaAdicional, false)
  assertPositive('parametros.kmTrasladoGrua', input.parametros?.kmTrasladoGrua, false)

  // Tarifas
  assertPositive('tarifas.montajePorTon', input.tarifas?.montajePorTon, false)
  assertPositive('tarifas.cuadrillaMasGruaDia', input.tarifas?.cuadrillaMasGruaDia, false)
  assertPositive('tarifas.gruaAdicionalDia', input.tarifas?.gruaAdicionalDia, false)
  assertPositive('tarifas.trasladoGruaPorKm', input.tarifas?.trasladoGruaPorKm, false)

  // Items
  if (!Array.isArray(input.items)) throw validationError('items', 'type:Array')
  input.items.forEach((item, idx) => {
    const base = `items[${idx}]`
    assertPositive(`${base}.cantidad`, item.cantidad, false)
    assertPositive(`${base}.precioPorUM_$`, item.precioPorUM_$, false)
    if (item.um === 'MT') {
      assertPositive(`${base}.longitudM`, req(item.longitudM, `${base}.longitudM`), true)
    }
    if (item.um === 'M2') {
      assertPositive(`${base}.longitudM`, req(item.longitudM, `${base}.longitudM`), true)
      assertPositive(`${base}.anchoM`, req(item.anchoM, `${base}.anchoM`), true)
    }
    if (item.pesoPorUM_tn !== undefined) {
      assertPositive(`${base}.pesoPorUM_tn`, item.pesoPorUM_tn, true)
    } else if (item.um === 'UND' && item.weightKgPorPieza !== undefined) {
      assertPositive(`${base}.weightKgPorPieza`, item.weightKgPorPieza, true)
    }
  })
}

// =====================
// Cálculos elementales
// =====================

function calcularMedida(item: ItemMaterial, basePath: string): number {
  switch (item.um) {
    case 'M2':
      return item.cantidad * req(item.longitudM, `${basePath}.longitudM`) * req(item.anchoM, `${basePath}.anchoM`)
    case 'MT':
      return item.cantidad * req(item.longitudM, `${basePath}.longitudM`)
    case 'UND':
      return item.cantidad
    default:
      throw validationError(`${basePath}.um`, 'unsupported')
  }
}

function calcularPesoTn(item: ItemMaterial, medida: number, basePath: string): number {
  if (item.pesoPorUM_tn !== undefined) {
    return medida * item.pesoPorUM_tn
  }
  if (item.um === 'UND' && item.weightKgPorPieza !== undefined) {
    return (item.cantidad * item.weightKgPorPieza) / 1000
  }
  throw validationError(`${basePath}`, 'peso:missing', 'Debe proveer pesoPorUM_tn o weightKgPorPieza para UND')
}

function indice(item: ItemMaterial, idx: Indices): number {
  return item.categoriaAjuste === 'ESPECIAL' ? idx.especial : idx.general
}

function seleccionarTarifa(tarifas: TarifaTransporte[], distanciaKm: number, categoriaLargo: CategoriaLargo): number {
  if (!Array.isArray(tarifas) || tarifas.length === 0) return 0
  const mismasCat = tarifas.filter(t => t.categoriaLargo === categoriaLargo)
  const pool = mismasCat.length ? mismasCat : tarifas
  const orden = [...pool].sort((a, b) => a.distanciaKmTramo - b.distanciaKmTramo)
  const tramo = orden.find(t => t.distanciaKmTramo >= distanciaKm) ?? orden[orden.length - 1]
  return tramo?.tarifaPorViaje ?? 0
}

function calcularTC(tc: TC_Renglon[], porcentajeGG: number, basePath: string) {
  const subtotal = sum(tc.map((r, i) => {
    const p = `${basePath}[${i}]`
    const med = r.um === 'M2'
      ? r.cantidad * req(r.longitudM, `${p}.longitudM`) * req(r.anchoM, `${p}.anchoM`)
      : r.um === 'MT'
        ? r.cantidad * req(r.longitudM, `${p}.longitudM`)
        : r.cantidad
    return med * r.precioPorUM_$
  }))
  const gg = subtotal * porcentajeGG
  return { subtotal: round(subtotal, 2), gg: round(gg, 2), total: round(subtotal + gg, 2) }
}

// =====================
// Función principal
// =====================

export function calcularPresupuesto(input: PresupuestoEntrada): PresupuestoSalida {
  assertInputs(input)

  const itemsCalc = input.items.map((item, i) => {
    const base = `items[${i}]`
    const medida = calcularMedida(item, base)
    const pesoTn = calcularPesoTn(item, medida, base)
    const totalBasico = medida * item.precioPorUM_$
    const indiceAplicado = indice(item, input.indices)
    const totalActualizado = totalBasico * indiceAplicado
    return {
      ...item,
      medida: round(medida, 3),
      pesoTn: round(pesoTn, 3),
      totalBasico: round(totalBasico, 2),
      indiceAplicado,
      totalActualizado: round(totalActualizado, 2)
    }
  })

  const subtotalMateriales = sum(itemsCalc.map(i => i.totalActualizado))
  const subtotalAjusteComercial = subtotalMateriales * (1 + input.ajustesMateriales.porcentajeComercial)
  const subtotalMaterialesFinal = subtotalAjusteComercial * input.ajustesMateriales.multiplicadorAdicional

  const tc1 = calcularTC(input.trabajosComplementarios.TC1 || [], input.parametros.porcentajeGG, 'trabajosComplementarios.TC1')
  const tc2 = calcularTC(input.trabajosComplementarios.TC2 || [], input.parametros.porcentajeGG, 'trabajosComplementarios.TC2')

  const pesoTotalTransporte = sum(itemsCalc.map(i => i.pesoTn))
  let viajes = 0, tarifaSeleccionada = 0, importeTransporteBase = 0, ggTransporte = 0, totalTransporte = 0
  if (input.parametros.habilitaTransporte) {
    viajes = (input.parametros.viajesOverride ?? null) !== null && (input.parametros.viajesOverride as any) !== undefined
      ? Math.ceil(Number(input.parametros.viajesOverride))
      : Math.ceil((pesoTotalTransporte || 0) / input.parametros.aforoToneladas)
    tarifaSeleccionada = seleccionarTarifa(input.tarifarioTransporte, input.parametros.distanciaKm, input.parametros.categoriaLargo)
    importeTransporteBase = viajes * tarifaSeleccionada
    ggTransporte = importeTransporteBase * input.parametros.porcentajeGG
    totalTransporte = importeTransporteBase + ggTransporte
  }

  let trasladoGrua_$ = 0, subtotalMontaje = 0, ggMontaje = 0, totalMontaje = 0
  if (input.parametros.habilitaMontaje) {
    const tnAMontar = pesoTotalTransporte
    const montajeEstandar = tnAMontar * input.tarifas.montajePorTon
    const montajePorDia = input.parametros.diasMontaje * input.tarifas.cuadrillaMasGruaDia
    const gruaAdicional = input.parametros.usaGruaAdicional ? input.parametros.diasGruaAdicional * input.tarifas.gruaAdicionalDia : 0
    const factorTraslado = input.parametros.usaGruaAdicional ? 4 : 2
    trasladoGrua_$ = (input.parametros.kmTrasladoGrua * factorTraslado) * input.tarifas.trasladoGruaPorKm
    subtotalMontaje = montajeEstandar + montajePorDia + gruaAdicional + trasladoGrua_$
    ggMontaje = subtotalMontaje * input.parametros.porcentajeGG
    totalMontaje = subtotalMontaje + ggMontaje
  }

  const totalMateriales = subtotalMaterialesFinal + tc1.total
  const totalPretensa = totalMateriales + totalTransporte + totalMontaje
  const totalGeneralPretensa = totalPretensa + tc2.total

  return {
    items: itemsCalc,
    materiales: {
      subtotalMateriales: round(subtotalMateriales, 2),
      subtotalAjusteComercial: round(subtotalAjusteComercial, 2),
      subtotalMaterialesFinal: round(subtotalMaterialesFinal, 2)
    },
    tc1,
    transporte: {
      habilitado: input.parametros.habilitaTransporte,
      pesoTotalTransporte: round(pesoTotalTransporte, 3),
      viajes,
      tarifaSeleccionada: round(tarifaSeleccionada, 2),
      importeTransporteBase: round(importeTransporteBase, 2),
      ggTransporte: round(ggTransporte, 2),
      totalTransporte: round(totalTransporte, 2)
    },
    montaje: {
      habilitado: input.parametros.habilitaMontaje,
      trasladoGrua_$: round(trasladoGrua_$, 2),
      subtotalMontaje: round(subtotalMontaje, 2),
      ggMontaje: round(ggMontaje, 2),
      totalMontaje: round(totalMontaje, 2)
    },
    totales: {
      totalMateriales: round(totalMateriales, 2),
      totalPretensa: round(totalPretensa, 2),
      totalGeneralPretensa: round(totalGeneralPretensa, 2)
    }
  }
}

// =====================
// Defaults sugeridos (pueden re-usarse en la UI)
// =====================

export const DEFAULT_INDICES: Indices = {
  general: 2895.44,
  especial: 2316.15
}

export const DEFAULT_PARAMETROS_BASE: Omit<Parametros, 'habilitaTransporte' | 'habilitaMontaje' | 'distanciaKm' | 'categoriaLargo' | 'diasMontaje' | 'diasGruaAdicional' | 'kmTrasladoGrua' | 'usaGruaAdicional'> & {
  diasMontaje: number
  diasGruaAdicional: number
  kmTrasladoGrua: number
  usaGruaAdicional: boolean
} = {
  porcentajeGG: 0.10,
  aforoToneladas: 26,
  diasMontaje: 0,
  diasGruaAdicional: 0,
  kmTrasladoGrua: 0,
  usaGruaAdicional: false
}

export const DEFAULT_TARIFAS: Tarifas = {
  montajePorTon: 85381,
  cuadrillaMasGruaDia: 4269062,
  gruaAdicionalDia: 2206451,
  trasladoGruaPorKm: 2625
}


