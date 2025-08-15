import React, { useEffect, useState } from 'react';
import { Search, Download, Calendar, MapPin, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { AdminShell, AdminToolbar, AdminCard, AdminTable, AdminEmpty, AdminModal, AdminToast } from '@compartido/componentes/AdminUI';

const MaterialsPrices = () => {
	// Mantener estado/lógica existente (acá solo placeholders mínimos)
	const [loading, setLoading] = useState(false);
	const [zoneId, setZoneId] = useState('');
	const [month, setMonth] = useState('');
	const [q, setQ] = useState('');
	const [data, setData] = useState([]);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [message, setMessage] = useState(null);

	useEffect(() => {
		// cargar datos (lógica original no tocada)
	}, [zoneId, month, q]);

	return (
		<AdminShell title="Insumos" subtitle="Precios mensuales por zona y where used">
			<AdminToolbar>
				<div className="flex flex-1 flex-wrap items-center gap-2">
					<div className="flex items-center gap-2">
						<MapPin className="w-4 h-4 text-gray-500" />
						<select aria-label="Zona" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
							<option value="">Zona</option>
							{/* opciones */}
						</select>
					</div>
					<div className="flex items-center gap-2">
						<Calendar className="w-4 h-4 text-gray-500" />
						<input aria-label="Mes" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
					</div>
					<div className="relative flex-1 min-w-[220px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input aria-label="Buscar" placeholder="Buscar material..." value={q} onChange={(e)=>setQ(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Cerrar mes">
						<CheckCircle className="w-4 h-4 mr-2" /> Cerrar mes
					</button>
					<button className="inline-flex items-center px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Exportar">
						<Download className="w-4 h-4 mr-2" /> Exportar
					</button>
				</div>
			</AdminToolbar>

			<AdminCard title="Listado de precios" description="Edite precios por material. Δ% respecto del mes anterior">
				{loading ? (
					<div className="animate-pulse space-y-2">
						<div className="h-10 bg-gray-100 rounded" />
						<div className="h-10 bg-gray-100 rounded" />
						<div className="h-10 bg-gray-100 rounded" />
					</div>
				) : data.length === 0 ? (
					<AdminEmpty icon={<Layers className="w-6 h-6" />} title="Sin insumos" description="Seleccione zona y mes para ver precios" />
				) : (
					<AdminTable>
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
								<th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
								<th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Δ% Mes-1</th>
								<th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 bg-white">
							{data.map((row) => (
								<tr key={row.material_id}>
									<td className="px-4 py-2 text-sm text-gray-900">{row.name}</td>
									<td className="px-4 py-2 text-sm text-gray-600">{row.unit}</td>
									<td className="px-4 py-2 text-sm text-right">
										<input type="number" className="w-28 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right" defaultValue={row.price} aria-label={`Precio ${row.name}`} />
									</td>
									<td className="px-4 py-2 text-sm text-right">
										<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.delta > 0 ? 'bg-red-50 text-red-700' : row.delta < 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{(row.delta*100).toFixed(1)}%</span>
									</td>
									<td className="px-4 py-2 text-sm text-center">
										<button onClick={()=>setDrawerOpen(true)} className="text-blue-600 hover:text-blue-800 underline">Where used</button>
									</td>
								</tr>
							))}
						</tbody>
					</AdminTable>
				)}
			</AdminCard>

			<AdminModal title="Where used" description="Piezas que utilizan el material" isOpen={drawerOpen} onClose={()=>setDrawerOpen(false)}>
				{/* tabla interna consistente */}
				<div className="text-sm text-gray-700">Contenido...</div>
			</AdminModal>

			{message && <AdminToast type={message.type} title={message.text} />}
		</AdminShell>
	);
};

export default MaterialsPrices;

