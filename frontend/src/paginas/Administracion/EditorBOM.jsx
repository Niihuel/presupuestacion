import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { materialService, api } from '@compartido/servicios'
import { ListTree, Search, Plus, Trash2, Save, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { AdminShell, AdminToolbar, AdminCard, AdminTable, AdminEmpty } from '@compartido/componentes/AdminUI'

export default function BOMEditor() {
  const qc = useQueryClient()
  const [pieceId, setPieceId] = useState('')
  const [materials, setMaterials] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'materialId', dir: 'asc' })
  const [selectedCols, setSelectedCols] = useState(['materialId','quantityPerUnit','scrapPercent'])

  const { data: formulaData, isLoading, refetch } = useQuery({
    queryKey: ['piece-bom', pieceId],
    enabled: !!pieceId,
    queryFn: () => materialService.getPieceFormula(Number(pieceId))
  })

  useEffect(() => {
    if (formulaData?.data) setMaterials(formulaData.data)
    else if (Array.isArray(formulaData)) setMaterials(formulaData)
  }, [formulaData])

  const updateMutation = useMutation({
    mutationFn: ({ pieceId, materials }) => materialService.updatePieceFormula(pieceId, materials),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['piece-bom'] })
  })

  const addRow = () => setMaterials(prev => [...prev, { materialId: '', quantityPerUnit: 0, scrapPercent: 0 }])
  const removeRow = (idx) => setMaterials(prev => prev.filter((_,i) => i!==idx))
  const updateRow = (idx, field, value) => setMaterials(prev => prev.map((r,i)=> i===idx ? { ...r, [field]: value } : r))

  const handleSave = async () => {
    await updateMutation.mutateAsync({ pieceId: Number(pieceId), materials })
    refetch()
  }

  const exportCSV = () => {
    const headers = ['material_id','quantity_per_unit','scrap_percent']
    const sep = ','
    const lines = materials.map(m => [m.materialId ?? '', m.quantityPerUnit ?? '', m.scrapPercent ?? ''].join(sep))
    const csv = [headers.join(sep), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bom_piece_${pieceId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    doc.setFontSize(12)
    doc.text('BOM por Pieza', 40, 40)
    doc.setFontSize(9)
    doc.text(`Pieza: ${pieceId}`, 40, 58)
    doc.autoTable({ startY: 70, head: [['Material ID','Consumo por UM','Scrap (%)']], body: materials.map(m => [m.materialId ?? '', m.quantityPerUnit ?? '', m.scrapPercent ?? '']) })
    doc.save(`bom_piece_${pieceId}.pdf`)
  }

  const filtered = materials
    .filter(r => !search || String(r.materialId ?? '').includes(search))
    .slice()
    .sort((a,b) => {
      const va = a[sort.key]; const vb = b[sort.key]
      if (va == null && vb == null) return 0
      if (va == null) return sort.dir === 'asc' ? -1 : 1
      if (vb == null) return sort.dir === 'asc' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') return sort.dir === 'asc' ? va - vb : vb - va
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })

  return (
    <AdminShell title="BOM por Pieza" subtitle="Consumos/UM y scrap por material">
      <AdminToolbar>
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="ID Pieza" type="number" min="1" placeholder="ID de pieza" value={pieceId} onChange={e => setPieceId(e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input aria-label="Buscar" placeholder="Buscar en BOM" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={addRow} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 inline-flex items-center gap-2"><Plus className="w-4 h-4"/> Agregar</button>
          <button onClick={exportCSV} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 inline-flex items-center gap-2"><Download className="w-4 h-4"/> CSV</button>
          <button onClick={exportPDF} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 inline-flex items-center gap-2"><FileText className="w-4 h-4"/> PDF</button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 inline-flex items-center gap-2"><Save className="w-4 h-4"/> Guardar BOM</button>
        </div>
      </AdminToolbar>

      <AdminCard>
        <div className="overflow-x-auto">
          <AdminTable>
            <thead className="bg-gray-50">
              <tr>
                {selectedCols.includes('materialId') && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    <button onClick={() => setSort(prev => ({ key: 'materialId', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Material ID</button>
                  </th>
                )}
                {selectedCols.includes('quantityPerUnit') && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    <button onClick={() => setSort(prev => ({ key: 'quantityPerUnit', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Consumo por UM</button>
                  </th>
                )}
                {selectedCols.includes('scrapPercent') && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    <button onClick={() => setSort(prev => ({ key: 'scrapPercent', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Scrap (%)</button>
                  </th>
                )}
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="p-4"><AdminEmpty title="Sin materiales en la BOM" description="Agregue renglones para comenzar"/></td></tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={idx}>
                    {selectedCols.includes('materialId') && (
                      <td className="px-4 py-2">
                        <input type="number" min="1" value={row.materialId} onChange={e => updateRow(idx, 'materialId', Number(e.target.value))} className="w-28 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
                      </td>
                    )}
                    {selectedCols.includes('quantityPerUnit') && (
                      <td className="px-4 py-2 text-right">
                        <input type="number" step="0.0001" value={row.quantityPerUnit} onChange={e => updateRow(idx, 'quantityPerUnit', Number(e.target.value))} className="w-32 text-right px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
                      </td>
                    )}
                    {selectedCols.includes('scrapPercent') && (
                      <td className="px-4 py-2 text-right">
                        <input type="number" step="0.1" min="0" max="100" value={row.scrapPercent ?? 0} onChange={e => updateRow(idx, 'scrapPercent', Number(e.target.value))} className="w-28 text-right px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="0-100"/>
                      </td>
                    )}
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeRow(idx)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </AdminTable>
        </div>
      </AdminCard>
    </AdminShell>
  )
}

