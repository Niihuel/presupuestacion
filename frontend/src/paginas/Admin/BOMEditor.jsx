import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { materialService, api } from '@compartido/services'
import { ListTree, Search, Plus, Trash2, Save, Copy, ClipboardPaste, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function BOMEditor() {
  const qc = useQueryClient()
  const [pieceId, setPieceId] = useState('')
  const [materials, setMaterials] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'materialId', dir: 'asc' })
  const [selectedCols, setSelectedCols] = useState(['materialId','quantityPerUnit','wasteFactor'])

  const { data: formulaData, isLoading, refetch } = useQuery({
    queryKey: ['piece-bom', pieceId],
    enabled: !!pieceId,
    queryFn: () => materialService.getPieceFormula(Number(pieceId))
  })

  useEffect(() => {
    if (formulaData?.data) {
      setMaterials(formulaData.data)
    } else if (Array.isArray(formulaData)) {
      setMaterials(formulaData)
    }
  }, [formulaData])

  const updateMutation = useMutation({
    mutationFn: ({ pieceId, materials }) => materialService.updatePieceFormula(pieceId, materials),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['piece-bom'] })
  })

  const validateMutation = useMutation({
    mutationFn: ({ pieceId, materials }) => materialService.validatePieceFormula(pieceId, materials)
  })

  const addRow = () => setMaterials(prev => [...prev, { materialId: '', quantityPerUnit: 0, wasteFactor: 1 }])
  const removeRow = (idx) => setMaterials(prev => prev.filter((_,i) => i!==idx))
  const updateRow = (idx, field, value) => setMaterials(prev => prev.map((r,i)=> i===idx ? { ...r, [field]: value } : r))

  const handleSave = async () => {
    await validateMutation.mutateAsync({ pieceId: Number(pieceId), materials })
    await updateMutation.mutateAsync({ pieceId: Number(pieceId), materials })
    refetch()
  }

  const exportCSV = () => {
    const headers = ['material_id','quantity_per_unit','waste_factor']
    const sep = ','
    const lines = materials.map(m => [m.materialId ?? '', m.quantityPerUnit ?? '', m.wasteFactor ?? ''].join(sep))
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
    doc.autoTable({
      startY: 70,
      head: [['Material ID','Consumo por UM','Factor Desperdicio']],
      body: materials.map(m => [m.materialId ?? '', m.quantityPerUnit ?? '', m.wasteFactor ?? ''])
    })
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><ListTree className="w-4 h-4"/> BOM por Pieza</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input type="number" min="1" placeholder="pieceId" value={pieceId} onChange={e => setPieceId(e.target.value)} className="w-28 px-2 py-1 border rounded"/>
          </div>
          <div className="flex items-center gap-1">
            <Search className="w-4 h-4"/>
            <input placeholder="Buscar en BOM" value={search} onChange={e => setSearch(e.target.value)} className="px-2 py-1 border rounded"/>
          </div>
          <button onClick={addRow} className="px-3 py-2 border rounded flex items-center gap-2"><Plus className="w-4 h-4"/> Agregar</button>
        </div>
      </div>

      <div className="bg-white border rounded overflow-hidden">
        <div className="p-3 border-b flex flex-wrap gap-3 items-center text-sm">
          <span className="text-gray-600">Columnas:</span>
          {['materialId','quantityPerUnit','wasteFactor'].map(k => (
            <label key={k} className="inline-flex items-center gap-2">
              <input type="checkbox" checked={selectedCols.includes(k)} onChange={e => setSelectedCols(prev => e.target.checked ? [...prev, k] : prev.filter(x => x !== k))} />
              <span>{k}</span>
            </label>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {selectedCols.includes('materialId') && (
                <th className="text-left p-2">
                  <button onClick={() => setSort(prev => ({ key: 'materialId', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Material ID</button>
                </th>
              )}
              {selectedCols.includes('quantityPerUnit') && (
                <th className="text-right p-2">
                  <button onClick={() => setSort(prev => ({ key: 'quantityPerUnit', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Consumo por UM</button>
                </th>
              )}
              {selectedCols.includes('wasteFactor') && (
                <th className="text-right p-2">
                  <button onClick={() => setSort(prev => ({ key: 'wasteFactor', dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="inline-flex items-center gap-1">Factor Desperdicio</button>
                </th>
              )}
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="p-4 text-center">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Sin materiales en la BOM.</td></tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {selectedCols.includes('materialId') && (
                    <td className="p-2">
                      <input type="number" min="1" value={row.materialId}
                        onChange={e => updateRow(idx, 'materialId', Number(e.target.value))}
                        className="w-28 px-2 py-1 border rounded"/>
                    </td>
                  )}
                  {selectedCols.includes('quantityPerUnit') && (
                    <td className="p-2 text-right">
                      <input type="number" step="0.0001" value={row.quantityPerUnit}
                        onChange={e => updateRow(idx, 'quantityPerUnit', Number(e.target.value))}
                        className="w-32 text-right px-2 py-1 border rounded"/>
                    </td>
                  )}
                  {selectedCols.includes('wasteFactor') && (
                    <td className="p-2 text-right">
                      <input type="number" step="0.01" value={row.wasteFactor ?? 1}
                        onChange={e => updateRow(idx, 'wasteFactor', Number(e.target.value))}
                        className="w-28 text-right px-2 py-1 border rounded"/>
                    </td>
                  )}
                  <td className="p-2 text-right">
                    <button onClick={() => removeRow(idx)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={exportCSV} className="px-3 py-2 border rounded flex items-center gap-2"><Download className="w-4 h-4"/> CSV</button>
        <button onClick={exportPDF} className="px-3 py-2 border rounded flex items-center gap-2"><FileText className="w-4 h-4"/> PDF</button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Save className="w-4 h-4"/> Guardar BOM</button>
      </div>
    </div>
  )
}

