import { useEffect, useMemo, useState } from 'react'
import { materialService } from '@compartido/services'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, RefreshCw, Save, Calendar, Factory, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function MaterialsPrices() {
  const qc = useQueryClient()
  const [zoneId, setZoneId] = useState('1')
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0,10))
  const [editRows, setEditRows] = useState({})
  const [sort, setSort] = useState({ key: 'material_id', dir: 'asc' })
  const INSUMO_COLS = [
    { key: 'material_id', label: 'material' },
    { key: 'price_current', label: 'mes' },
    { key: 'price_prev', label: 'mes_1' },
    { key: 'delta_percent', label: 'delta' }
  ]
  const [selectedCols, setSelectedCols] = useState(INSUMO_COLS.map(c => c.key))

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['materials-prices', zoneId, asOf],
    queryFn: () => materialService.getVigenteMaterialPrices(zoneId, asOf)
  })

  const setPriceMutation = useMutation({
    mutationFn: ({ material_id, price, valid_from }) => materialService.setMaterialPrice({ material_id, zone_id: Number(zoneId), price, valid_from }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials-prices'] })
  })

  const closeMonthMutation = useMutation({
    mutationFn: ({ month_date }) => materialService.closeMaterialPricesMonth(Number(zoneId), month_date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials-prices'] })
  })

  const handleEdit = (material_id, value) => {
    setEditRows(prev => ({ ...prev, [material_id]: value }))
  }

  const handleSave = async () => {
    const entries = Object.entries(editRows)
    for (const [material_id, price] of entries) {
      await setPriceMutation.mutateAsync({ material_id: Number(material_id), price: Number(price), valid_from: asOf })
    }
    setEditRows({})
    refetch()
  }

  const handleCloseMonth = async () => {
    const month_date = asOf.slice(0,7) + '-01'
    await closeMonthMutation.mutateAsync({ month_date })
    refetch()
  }

  const exportCSV = () => {
    const headers = INSUMO_COLS.filter(c => selectedCols.includes(c.key)).map(c => c.label)
    const sep = ','
    const headerLine = headers.join(sep)
    const sorted = Array.isArray(rows) ? rows.slice() : []
    sorted.sort((a,b) => {
      const va = a[sort.key]; const vb = b[sort.key]
      if (va == null && vb == null) return 0
      if (va == null) return sort.dir === 'asc' ? -1 : 1
      if (vb == null) return sort.dir === 'asc' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') return sort.dir === 'asc' ? va - vb : vb - va
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    const lines = sorted.map(r => INSUMO_COLS.filter(c => selectedCols.includes(c.key)).map(c => r[c.key] ?? '').join(sep))
    const csv = [headerLine, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `insumos_${zoneId}_${asOf.slice(0,7)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    doc.setFontSize(12)
    doc.text('Insumos Vigentes', 40, 40)
    doc.setFontSize(9)
    doc.text(`Zona: ${zoneId}  -  Fecha: ${asOf}`, 40, 58)
    const head = [INSUMO_COLS.filter(c => selectedCols.includes(c.key)).map(c => c.label.toUpperCase())]
    const sorted = Array.isArray(rows) ? rows.slice() : []
    sorted.sort((a,b) => {
      const va = a[sort.key]; const vb = b[sort.key]
      if (va == null && vb == null) return 0
      if (va == null) return sort.dir === 'asc' ? -1 : 1
      if (vb == null) return sort.dir === 'asc' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') return sort.dir === 'asc' ? va - vb : vb - va
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    const body = sorted.map(r => INSUMO_COLS.filter(c => selectedCols.includes(c.key)).map(c => c.key === 'delta_percent' && r[c.key] != null ? (r[c.key]*100).toFixed(2)+'%' : (r[c.key] ?? '')))
    doc.autoTable({ startY: 70, head, body })
    doc.save(`insumos_${zoneId}_${asOf.slice(0,7)}.pdf`)
  }

  const displayedRows = useMemo(() => {
    const arr = Array.isArray(rows) ? rows.slice() : []
    arr.sort((a,b) => {
      const va = a[sort.key]; const vb = b[sort.key]
      if (va == null && vb == null) return 0
      if (va == null) return sort.dir === 'asc' ? -1 : 1
      if (vb == null) return sort.dir === 'asc' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') return sort.dir === 'asc' ? va - vb : vb - va
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    return arr
  }, [rows, sort])

  const toggleSort = (key) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4"/> Catálogo de Precios de Insumos (Vigentes)</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Factory className="w-4 h-4"/>
            <input type="number" min="1" value={zoneId} onChange={e => setZoneId(e.target.value)} className="w-20 px-2 py-1 border rounded"/>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4"/>
            <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="px-2 py-1 border rounded"/>
          </div>
          <button onClick={() => refetch()} className="px-3 py-2 border rounded flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Refrescar</button>
        </div>
      </div>

      <div className="bg-white border rounded overflow-hidden">
        {/* Column selector */}
        <div className="p-3 border-b flex flex-wrap gap-3 items-center text-sm">
          <span className="text-gray-600">Columnas:</span>
          {INSUMO_COLS.map(c => (
            <label key={c.key} className="inline-flex items-center gap-2">
              <input type="checkbox" checked={selectedCols.includes(c.key)} onChange={e => setSelectedCols(prev => e.target.checked ? [...prev, c.key] : prev.filter(k => k !== c.key))} />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {INSUMO_COLS.filter(c => selectedCols.includes(c.key)).map(c => (
                <th key={c.key} className={`p-2 ${c.key === 'material_id' ? 'text-left' : 'text-right'}`}>
                  <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1">
                    {c.label}
                    {sort.key === c.key ? (<span className="text-gray-400">{sort.dir === 'asc' ? '▲' : '▼'}</span>) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="p-4 text-center">Cargando...</td></tr>
            ) : displayedRows.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Sin datos</td></tr>
            ) : (
              displayedRows.map(r => (
                <tr key={r.material_id} className="border-t">
                  {INSUMO_COLS.filter(c => selectedCols.includes(c.key)).map(c => (
                    c.key === 'material_id' ? (
                      <td key={c.key} className="p-2">{r.material_id}</td>
                    ) : c.key === 'price_current' ? (
                      <td key={c.key} className="p-2 text-right">
                        <input type="number" step="0.01" defaultValue={r.price_current || 0}
                          onChange={e => handleEdit(r.material_id, e.target.value)}
                          className="w-28 text-right px-2 py-1 border rounded"/>
                      </td>
                    ) : c.key === 'price_prev' ? (
                      <td key={c.key} className="p-2 text-right">{r.price_prev?.toLocaleString?.() ?? '-'}</td>
                    ) : (
                      <td key={c.key} className="p-2 text-right">{r.delta_percent != null ? (r.delta_percent*100).toFixed(2)+'%' : '-'}</td>
                    )
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={exportCSV} className="px-3 py-2 border rounded flex items-center gap-2"><Download className="w-4 h-4"/> CSV</button>
        <button onClick={exportPDF} className="px-3 py-2 border rounded flex items-center gap-2"><FileText className="w-4 h-4"/> PDF</button>
        <button onClick={handleCloseMonth} className="px-4 py-2 bg-amber-600 text-white rounded">Cerrar Mes</button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Save className="w-4 h-4"/> Guardar</button>
      </div>
    </div>
  )
}

