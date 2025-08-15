import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pieceService } from '@compartido/servicios'
import { DollarSign, RefreshCw, Save, Calendar, Factory, Calculator, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { AdminShell, AdminToolbar, AdminCard, AdminToast } from '@compartido/componentes/AdminUI'

export default function PiecePrices() {
  const qc = useQueryClient()
  const [zoneId, setZoneId] = useState('1')
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0,10))
  const [pieceId, setPieceId] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0,10))

  const calcQuery = useQuery({
    queryKey: ['piece-tvf', pieceId, zoneId, asOf],
    enabled: !!pieceId && !!zoneId,
    queryFn: () => pieceService.getTVFPrice(Number(pieceId), { zone_id: Number(zoneId), as_of: asOf })
  })

  const publishMutation = useMutation({
    mutationFn: () => pieceService.publishPiecePrice(Number(pieceId), { zone_id: Number(zoneId), as_of: asOf, effective_date: effectiveDate }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['piece-tvf'] })
  })

  const handleCalculate = () => calcQuery.refetch()
  const handlePublish = async () => {
    await publishMutation.mutateAsync()
    calcQuery.refetch()
  }

  const res = calcQuery.data

  const exportCSV = () => {
    if (!res) return
    const headers = ['pieza','zona','as_of','materiales','proceso_por_tn','mo_hormigon','mo_acero','total']
    const row = [pieceId, zoneId, asOf, res.materiales ?? '', res.proceso_por_tn ?? '', res.mano_obra_hormigon ?? '', res.mano_obra_acero ?? '', res.total ?? '']
    const csv = [headers.join(','), row.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pieza_${pieceId}_zona_${zoneId}_${asOf}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    if (!res) return
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    doc.setFontSize(12)
    doc.text('Publicación de Precios - Pieza', 40, 40)
    doc.setFontSize(9)
    doc.text(`Pieza: ${pieceId}  Zona: ${zoneId}  Fecha: ${asOf}`, 40, 58)
    doc.autoTable({
      startY: 70,
      head: [['Materiales','Proceso/tn','MO Hormigón','MO Acero','Total']],
      body: [[res.materiales ?? '', res.proceso_por_tn ?? '', res.mano_obra_hormigon ?? '', res.mano_obra_acero ?? '', res.total ?? '']]
    })
    doc.save(`pieza_${pieceId}_zona_${zoneId}_${asOf}.pdf`)
  }

  return (
    <AdminShell title="Publicación de Precios" subtitle="Calcular y publicar precios mensuales por pieza">
      <AdminToolbar>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-gray-500"/>
            <input aria-label="Zona" type="number" min="1" value={zoneId} onChange={e => setZoneId(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500"/>
            <input aria-label="Fecha base" type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-500"/>
            <input aria-label="ID Pieza" type="number" min="1" placeholder="ID de pieza" value={pieceId} onChange={e => setPieceId(e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCalculate} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><RefreshCw className="w-4 h-4 mr-2"/> Calcular</button>
        </div>
      </AdminToolbar>

      <AdminCard title="Desglose calculado" description="Precio por UM desde servidor">
        {calcQuery.isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        ) : !res ? (
          <div className="text-sm text-gray-500">Ingrese pieza/zona/fecha y calcule.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Materiales:</span> <span className="font-medium">{res.materiales?.toLocaleString?.('es-AR',{style:'currency',currency:'ARS'}) ?? res.materiales}</span></div>
            <div><span className="text-gray-500">Proceso/tn:</span> <span className="font-medium">{res.proceso_por_tn}</span></div>
            <div><span className="text-gray-500">MO Hormigón:</span> <span className="font-medium">{res.mano_obra_hormigon}</span></div>
            <div><span className="text-gray-500">MO Acero:</span> <span className="font-medium">{res.mano_obra_acero}</span></div>
            <div className="md:col-span-2 border-t pt-2"><span className="text-gray-500">Total (base):</span> <span className="font-semibold">{res.total?.toLocaleString?.('es-AR',{style:'currency',currency:'ARS'}) ?? res.total}</span></div>
          </div>
        )}
      </AdminCard>

      <AdminCard title="Publicación" description="Exportar y publicar precio del período">
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button onClick={exportCSV} disabled={!res} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"><Download className="w-4 h-4"/> CSV</button>
          <button onClick={exportPDF} disabled={!res} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"><FileText className="w-4 h-4"/> PDF</button>
          <input aria-label="Fecha efectiva" type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
          <button disabled={!res} onClick={handlePublish} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"><Save className="w-4 h-4"/> Publicar</button>
        </div>
      </AdminCard>

      {(publishMutation.isError || calcQuery.isError) && (
        <AdminToast type="error" title="Error" description="Hubo un problema al procesar la solicitud" />
      )}
    </AdminShell>
  )
}

