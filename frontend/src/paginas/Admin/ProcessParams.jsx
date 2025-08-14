import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService, api } from '@compartido/services'
import { Cog, Save, RefreshCw, Calendar, Factory } from 'lucide-react'

async function fetchParams(zone_id, month_date) {
  const params = new URLSearchParams({ zone_id: String(zone_id), month_date })
  const { data } = await api.get(`/admin/process-params?${params.toString()}`)
  return data?.data || null
}

async function upsertParams(payload) {
  const { data } = await api.post('/admin/process-params', payload)
  return data?.data || null
}

export default function ProcessParams() {
  const qc = useQueryClient()
  const [zoneId, setZoneId] = useState('1')
  const [monthDate, setMonthDate] = useState(new Date().toISOString().slice(0,7) + '-01')

  const { data: params, isLoading, refetch } = useQuery({
    queryKey: ['process-params', zoneId, monthDate],
    queryFn: () => fetchParams(zoneId, monthDate)
  })

  const mutation = useMutation({
    mutationFn: upsertParams,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['process-params'] })
  })

  const [form, setForm] = useState({
    energia_curado_tn: 0, gg_fabrica_tn: 0, gg_empresa_tn: 0, utilidad_tn: 0, ingenieria_tn: 0,
    precio_hora: 0, horas_por_tn_acero: 70, horas_por_m3_hormigon: 25
  })

  const loadToForm = () => {
    if (params) {
      setForm({
        energia_curado_tn: params.energia_curado_tn ?? 0,
        gg_fabrica_tn: params.gg_fabrica_tn ?? 0,
        gg_empresa_tn: params.gg_empresa_tn ?? 0,
        utilidad_tn: params.utilidad_tn ?? 0,
        ingenieria_tn: params.ingenieria_tn ?? 0,
        precio_hora: params.precio_hora ?? 0,
        horas_por_tn_acero: params.horas_por_tn_acero ?? 70,
        horas_por_m3_hormigon: params.horas_por_m3_hormigon ?? 25
      })
    }
  }

  const handleSave = async () => {
    const payload = { zone_id: Number(zoneId), month_date: monthDate, ...form }
    await mutation.mutateAsync(payload)
    refetch()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Cog className="w-4 h-4"/> Parámetros de Proceso (Mensual)</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Factory className="w-4 h-4"/>
            <input type="number" min="1" value={zoneId} onChange={e => setZoneId(e.target.value)} className="w-20 px-2 py-1 border rounded"/>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4"/>
            <input type="month" value={monthDate.slice(0,7)} onChange={e => setMonthDate(e.target.value + '-01')} className="px-2 py-1 border rounded"/>
          </div>
          <button onClick={() => { refetch(); setTimeout(loadToForm, 0) }} className="px-3 py-2 border rounded flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Cargar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border rounded p-4">
        {[
          ['energia_curado_tn', '$ Energía/Curado por tn'],
          ['gg_fabrica_tn', '$ GG Fábrica por tn'],
          ['gg_empresa_tn', '$ GG Empresa por tn'],
          ['utilidad_tn', '$ Utilidad por tn'],
          ['ingenieria_tn', '$ Ingeniería por tn'],
          ['precio_hora', '$ por hora'],
          ['horas_por_tn_acero', 'hs por tn acero'],
          ['horas_por_m3_hormigon', 'hs por m3 hormigón']
        ].map(([key, label]) => (
          <div key={key}>
            <label className="block text-sm text-gray-700 mb-1">{label}</label>
            <input type="number" step="0.01" value={form[key]}
              onChange={e => setForm(prev => ({ ...prev, [key]: Number(e.target.value || 0) }))}
              className="w-full px-3 py-2 border rounded"/>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Save className="w-4 h-4"/> Guardar</button>
      </div>
    </div>
  )
}

