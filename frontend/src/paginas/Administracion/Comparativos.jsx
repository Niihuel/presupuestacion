import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { materialService, pieceService } from '@compartido/services'
import { BarChart3, Factory, Calendar, Search, RefreshCw, ArrowUpRight, ArrowDownRight, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

function formatPct(x) {
  if (x == null) return '-'
  return (x * 100).toFixed(2) + '%'
}

function monthStart(dateStr) {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth()
  return `${y}-${String(m + 1).padStart(2,'0')}-01`
}

function prevMonthStart(dateStr) {
  const d = new Date(dateStr)
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  const y = d.getFullYear()
  const m = d.getMonth()
  return `${y}-${String(m + 1).padStart(2,'0')}-01`
}

export default function Comparativos() {
  const [zoneId, setZoneId] = useState('1')
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0,10))

  // ============ Insumos ============
  const { data: insumos = [], isLoading: loadingInsumos, refetch: refetchInsumos } = useQuery({
    queryKey: ['comparativos-insumos', zoneId, asOf],
    queryFn: () => materialService.getVigenteMaterialPrices(zoneId, asOf)
  })

  const [deltaMin, setDeltaMin] = useState(-100)
  const [deltaMax, setDeltaMax] = useState(100)
  const [topN, setTopN] = useState(10)

  const topUp = useMemo(() => {
    const rows = Array.isArray(insumos) ? insumos.slice() : []
    const filtered = rows.filter(r => {
      const d = (r.delta_percent ?? 0) * 100
      return d >= deltaMin && d <= deltaMax
    })
    return filtered.sort((a,b) => (b.delta_percent ?? 0) - (a.delta_percent ?? 0)).slice(0, topN)
  }, [insumos, deltaMin, deltaMax, topN])

  const topDown = useMemo(() => {
    const rows = Array.isArray(insumos) ? insumos.slice() : []
    const filtered = rows.filter(r => {
      const d = (r.delta_percent ?? 0) * 100
      return d >= deltaMin && d <= deltaMax
    })
    return filtered.sort((a,b) => (a.delta_percent ?? 0) - (b.delta_percent ?? 0)).slice(0, topN)
  }, [insumos, deltaMin, deltaMax, topN])

  // ============ Piezas ============
  const [search, setSearch] = useState('')
  const { data: piecesList = { pieces: [] }, refetch: refetchPieces } = useQuery({
    queryKey: ['comparativos-piezas', search],
    enabled: !!search && search.length >= 2,
    queryFn: () => pieceService.getPieces({ search, limit: 20 })
  })

  const [pieceDeltas, setPieceDeltas] = useState({})
  const calcPieceMutation = useMutation({
    mutationFn: async (pieceId) => {
      const current = await pieceService.getTVFPrice(pieceId, { zone_id: Number(zoneId), as_of: monthStart(asOf) })
      const prev = await pieceService.getTVFPrice(pieceId, { zone_id: Number(zoneId), as_of: prevMonthStart(asOf) })
      // publicado (vigencias): último y anterior por effective_date en zona
      let priceDelta = null
      try {
        const pricesResp = await pieceService.getPiecePrices(pieceId)
        const prices = pricesResp?.data || pricesResp || []
        const forZone = prices.filter(p => p.zone_id === Number(zoneId)).sort((a,b) => new Date(b.effective_date || b.created_at) - new Date(a.effective_date || a.created_at))
        if (forZone.length >= 2) {
          const a = Number(forZone[0].final_price ?? forZone[0].base_price ?? 0)
          const b = Number(forZone[1].final_price ?? forZone[1].base_price ?? 0)
          priceDelta = b === 0 ? null : (a / b) - 1
        }
      } catch {}
      return {
        cost_current: current?.total ?? null,
        cost_prev: prev?.total ?? null,
        cost_delta: current?.total && prev?.total ? (current.total / prev.total) - 1 : null,
        price_delta: priceDelta
      }
    },
    onSuccess: (data, pieceId) => setPieceDeltas(prev => ({ ...prev, [pieceId]: data }))
  })

  const pieces = piecesList?.pieces || []

  const exportCSV = (rows, headers, filename) => {
    const sep = ','
    const headerLine = headers.map(h => '"' + h + '"').join(sep)
    const lines = rows.map(r => r.map(v => '"' + String(v ?? '') + '"').join(sep))
    const csv = [headerLine, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    doc.setFontSize(12)
    doc.text('Comparativos Mes vs Mes-1', 40, 40)
    doc.setFontSize(9)
    doc.text(`Zona: ${zoneId}  -  Mes: ${asOf.slice(0,7)}`, 40, 58)

    // Insumos Top Subas
    doc.autoTable({
      startY: 70,
      head: [['Material', 'Mes', 'Mes-1', 'Δ%']],
      body: topUp.map(r => [r.material_id, r.price_current, r.price_prev ?? '-', formatPct(r.delta_percent)])
    })

    // Insumos Top Bajas
    const afterUp = doc.lastAutoTable.finalY + 15
    doc.autoTable({
      startY: afterUp,
      head: [['Material', 'Mes', 'Mes-1', 'Δ%']],
      body: topDown.map(r => [r.material_id, r.price_current, r.price_prev ?? '-', formatPct(r.delta_percent)])
    })

    // Piezas (solo las que tienen delta calculado en pantalla)
    const pieceRows = pieces
      .filter(p => pieceDeltas[p.id])
      .map(p => {
        const d = pieceDeltas[p.id]
        return [p.name || p.code || p.id, d.cost_current ?? '-', d.cost_prev ?? '-', formatPct(d.cost_delta), formatPct(d.price_delta)]
      })
    const afterDown = doc.lastAutoTable.finalY + 15
    doc.autoTable({
      startY: afterDown,
      head: [['Pieza', 'Costo Mes', 'Costo Mes-1', 'Δ% Costo', 'Δ% Precio']],
      body: pieceRows
    })

    doc.save(`comparativos_${zoneId}_${asOf.slice(0,7)}.pdf`)
  }

  // Ordenamiento simple por columnas para tablas de insumos y piezas (UI ligera)
  const [sortUp, setSortUp] = useState({ key: 'delta_percent', dir: 'desc' })
  const [sortDown, setSortDown] = useState({ key: 'delta_percent', dir: 'asc' })
  const [sortPieces, setSortPieces] = useState({ key: 'cost_delta', dir: 'desc' })
  const upSorted = useMemo(() => {
    const arr = topUp.slice()
    arr.sort((a,b) => (sortUp.dir === 'asc' ? 1 : -1) * ((a[sortUp.key] ?? 0) - (b[sortUp.key] ?? 0)))
    return arr
  }, [topUp, sortUp])
  const downSorted = useMemo(() => {
    const arr = topDown.slice()
    arr.sort((a,b) => (sortDown.dir === 'asc' ? 1 : -1) * ((a[sortDown.key] ?? 0) - (b[sortDown.key] ?? 0)))
    return arr
  }, [topDown, sortDown])
  const pieceRows = useMemo(() => {
    return (pieces || []).map(p => ({
      id: p.id,
      name: p.name || p.code || p.id,
      ...pieceDeltas[p.id]
    })).filter(r => r.cost_current != null || r.cost_prev != null)
  }, [pieces, pieceDeltas])
  const pieceSorted = useMemo(() => {
    const arr = pieceRows.slice()
    arr.sort((a,b) => {
      const va = a[sortPieces.key]; const vb = b[sortPieces.key]
      if (va == null && vb == null) return 0
      if (va == null) return sortPieces.dir === 'asc' ? -1 : 1
      if (vb == null) return sortPieces.dir === 'asc' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') return sortPieces.dir === 'asc' ? va - vb : vb - va
      return sortPieces.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    return arr
  }, [pieceRows, sortPieces])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4"/> Comparativos Mes vs Mes-1</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Factory className="w-4 h-4"/>
            <input type="number" min="1" value={zoneId} onChange={e => setZoneId(e.target.value)} className="w-20 px-2 py-1 border rounded"/>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4"/>
            <input type="month" value={asOf.slice(0,7)} onChange={e => setAsOf(e.target.value + '-01')} className="px-2 py-1 border rounded"/>
          </div>
          <button onClick={() => { refetchInsumos(); if (search) refetchPieces() }} className="px-3 py-2 border rounded flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Refrescar</button>
        </div>
      </div>

      {/* Filtros para Δ% y Top N */}
      <div className="bg-white border rounded p-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span>Δ% Min:</span>
          <input type="range" min={-100} max={100} value={deltaMin} onChange={e => setDeltaMin(Number(e.target.value))} />
          <span className="w-12 text-right">{deltaMin}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Δ% Max:</span>
          <input type="range" min={-100} max={100} value={deltaMax} onChange={e => setDeltaMax(Number(e.target.value))} />
          <span className="w-12 text-right">{deltaMax}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Top N:</span>
          <input type="number" min={1} max={100} value={topN} onChange={e => setTopN(Number(e.target.value || 10))} className="w-20 px-2 py-1 border rounded" />
        </div>
      </div>

      {/* Controles de export */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => exportCSV(
            topUp.map(r => [r.material_id, r.price_current, r.price_prev ?? '', r.delta_percent ?? '']),
            ['material','mes','mes_1','delta'],
            `insumos_subas_${zoneId}_${asOf.slice(0,7)}.csv`
          )}
          className="px-3 py-2 border rounded flex items-center gap-2"
        >
          <Download className="w-4 h-4"/> CSV Subas
        </button>
        <button
          onClick={() => exportCSV(
            topDown.map(r => [r.material_id, r.price_current, r.price_prev ?? '', r.delta_percent ?? '']),
            ['material','mes','mes_1','delta'],
            `insumos_bajas_${zoneId}_${asOf.slice(0,7)}.csv`
          )}
          className="px-3 py-2 border rounded flex items-center gap-2"
        >
          <Download className="w-4 h-4"/> CSV Bajas
        </button>
        <button
          onClick={() => exportCSV(
            pieces.filter(p => pieceDeltas[p.id]).map(p => {
              const d = pieceDeltas[p.id];
              return [p.name || p.code || p.id, d.cost_current ?? '', d.cost_prev ?? '', d.cost_delta ?? '', d.price_delta ?? '']
            }),
            ['pieza','costo_mes','costo_mes_1','delta_costo','delta_precio'],
            `piezas_${zoneId}_${asOf.slice(0,7)}.csv`
          )}
          className="px-3 py-2 border rounded flex items-center gap-2"
        >
          <Download className="w-4 h-4"/> CSV Piezas
        </button>
        <button onClick={exportPDF} className="px-3 py-2 border rounded flex items-center gap-2">
          <FileText className="w-4 h-4"/> PDF
        </button>
      </div>

      {/* Insumos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2 text-green-700">Subas Top 10 <ArrowUpRight className="w-4 h-4"/></h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Material</th>
                <th className="text-right p-2">
                  <button onClick={() => setSortUp(prev => ({ key: 'price_current', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Mes</button>
                </th>
                <th className="text-right p-2">
                  <button onClick={() => setSortUp(prev => ({ key: 'price_prev', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Mes-1</button>
                </th>
                <th className="text-right p-2">
                  <button onClick={() => setSortUp(prev => ({ key: 'delta_percent', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Δ%</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingInsumos ? (
                <tr><td colSpan={4} className="p-4 text-center">Cargando...</td></tr>
              ) : upSorted.map(r => (
                <tr key={`up-${r.material_id}`} className="border-t">
                  <td className="p-2">{r.material_id}</td>
                  <td className="p-2 text-right">{r.price_current}</td>
                  <td className="p-2 text-right">{r.price_prev ?? '-'}</td>
                  <td className="p-2 text-right text-green-700">{formatPct(r.delta_percent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2 text-red-700">Bajas Top 10 <ArrowDownRight className="w-4 h-4"/></h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Material</th>
                <th className="text-right p-2">
                  <button onClick={() => setSortDown(prev => ({ key: 'price_current', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Mes</button>
                </th>
                <th className="text-right p-2">
                  <button onClick={() => setSortDown(prev => ({ key: 'price_prev', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Mes-1</button>
                </th>
                <th className="text-right p-2">
                  <button onClick={() => setSortDown(prev => ({ key: 'delta_percent', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Δ%</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingInsumos ? (
                <tr><td colSpan={4} className="p-4 text-center">Cargando...</td></tr>
              ) : downSorted.map(r => (
                <tr key={`down-${r.material_id}`} className="border-t">
                  <td className="p-2">{r.material_id}</td>
                  <td className="p-2 text-right">{r.price_current}</td>
                  <td className="p-2 text-right">{r.price_prev ?? '-'}</td>
                  <td className="p-2 text-right text-red-700">{formatPct(r.delta_percent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Piezas */}
      <div className="bg-white border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Piezas (Δ% Costo y Δ% Precio Publicado)</h3>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4"/>
            <input placeholder="Buscar pieza (min 2 caracteres)" value={search} onChange={e => setSearch(e.target.value)} className="px-2 py-1 border rounded"/>
            <button onClick={() => search && refetchPieces()} className="px-3 py-2 border rounded flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Buscar</button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">
                <button onClick={() => setSortPieces(prev => ({ key: 'name', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Pieza</button>
              </th>
              <th className="text-right p-2">
                <button onClick={() => setSortPieces(prev => ({ key: 'cost_current', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Costo Mes</button>
              </th>
              <th className="text-right p-2">
                <button onClick={() => setSortPieces(prev => ({ key: 'cost_prev', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Costo Mes-1</button>
              </th>
              <th className="text-right p-2">
                <button onClick={() => setSortPieces(prev => ({ key: 'cost_delta', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Δ% Costo</button>
              </th>
              <th className="text-right p-2">
                <button onClick={() => setSortPieces(prev => ({ key: 'price_delta', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Δ% Precio Publicado</button>
              </th>
              <th className="text-right p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pieces.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Sin resultados</td></tr>
            ) : pieceSorted.map(row => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.name}</td>
                <td className="p-2 text-right">{row.cost_current ?? '-'}</td>
                <td className="p-2 text-right">{row.cost_prev ?? '-'}</td>
                <td className="p-2 text-right">{formatPct(row.cost_delta)}</td>
                <td className="p-2 text-right">{formatPct(row.price_delta)}</td>
                <td className="p-2 text-right">
                  <button onClick={() => calcPieceMutation.mutate(row.id)} className="px-3 py-1 border rounded">Calcular</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

