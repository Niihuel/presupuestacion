"use client";
import { useState } from "react";
import useSWR from "swr";
import axios from "axios";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

interface NewBudgetFormProps {
  initialCustomers?: any[];
  initialPlants?: any[];
  initialPieces?: any[];
}

export default function NewBudgetForm({ 
  initialCustomers = [], 
  initialPlants = [], 
  initialPieces = [] 
}: NewBudgetFormProps) {
	const [step, setStep] = useState(1);
	const customers = useSWR("/api/customers", fetcher, { fallbackData: { items: initialCustomers } }).data?.items ?? [];
	const plants = useSWR("/api/plants?page=1&pageSize=100", fetcher, { fallbackData: { items: initialPlants } }).data?.items ?? [];
	const pieces = useSWR("/api/pieces?page=1&pageSize=1000", fetcher, { fallbackData: { items: initialPieces } }).data?.items ?? [];
	const [form, setForm] = useState<any>({ items: [] });
	const [createdId, setCreatedId] = useState<string|undefined>();
	const [creating, setCreating] = useState(false);

	async function createBudget(){
 		try{
 			setCreating(true);
 			const filtered = pieces.filter((pc:any)=>!form.plantId || pc.plantId===form.plantId);
 			const items = (form.items || []).map((row:any, idx:number)=>{
 				const pc = filtered[idx];
 				if (!pc || !row || !row.quantity || row.quantity<=0) return null;
 				return { pieceId: pc.id, quantity: Number(row.quantity), optional: !!row.optional };
 			}).filter(Boolean) as any[];
 			const payload:any = {
 				customerId: form.customerId,
 				projectName: form.projectName,
 				plantId: form.plantId,
 				items,
 			};
 			const res = await axios.post("/api/budgets", payload);
 			const id = (res.data && (res.data.id || res.data?.budget?.id || res.data?.data?.id)) as string | undefined;
 			setCreatedId(id);
 		} finally {
 			setCreating(false);
 		}
 	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold">Nuevo Presupuesto</h1>
			<div className="flex gap-2 text-sm">
				{[1,2,3,4,5,6].map(n => (
					<button key={n} onClick={() => setStep(n)} className={`px-3 py-1 rounded border transition-colors ${step===n?"bg-black text-white dark:bg-white dark:text-black":"hover:bg-gray-100 dark:hover:bg-gray-900"}`}>Paso {n}</button>
				))}
			</div>
			{step===1 && (
				<section className="space-y-3">
					<h2 className="font-medium">1) Cliente y Obra</h2>
					<select className="w-full border rounded px-3 py-2" value={form.customerId ?? ""} onChange={e=>setForm((f:any)=>({...f, customerId: e.target.value}))}>
						<option value="">Seleccione cliente...</option>
						{customers.map((c:any)=>(<option key={c.id} value={c.id}>{c.companyName}</option>))}
					</select>
					<input className="w-full border rounded px-3 py-2" placeholder="Nombre de obra" value={form.projectName ?? ""} onChange={e=>setForm((f:any)=>({...f, projectName: e.target.value}))} />
					<button className="rounded bg-black text-white px-4 py-2" onClick={()=>setStep(2)}>Siguiente</button>
				</section>
			)}
			{step===2 && (
				<section className="space-y-3">
					<h2 className="font-medium">2) Piezas y Cantidades</h2>
					<div>
						<label className="block text-sm">Planta Origen</label>
						<select className="w-full border rounded px-3 py-2" value={form.plantId ?? ""} onChange={e=>setForm((f:any)=>({...f, plantId: e.target.value }))}>
							<option value="">Seleccione planta...</option>
							{plants.map((p:any)=>(<option key={p.id} value={p.id}>{p.name}</option>))}
						</select>
					</div>
					<div className="overflow-x-auto border rounded-md bg-white dark:bg-transparent">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 dark:bg-neutral-900"><tr><th className="text-left p-2">Pieza</th><th className="text-left p-2">Opcional</th><th className="text-left p-2">Cantidad</th><th className="text-left p-2">Unitario</th><th className="text-left p-2">Subtotal</th></tr></thead>
							<tbody>
								{(pieces.filter((pc:any)=>!form.plantId || pc.plantId===form.plantId)).map((pc:any, idx:number)=>{
									const row = form.items[idx] ?? { quantity: 0, optional: false };
									const unit = pc.priceCordoba ?? 0;
									const subtotal = (row.quantity ?? 0) * unit;
									return (
										<tr key={pc.id} className="border-t">
											<td className="p-2">{pc.description}</td>
											<td className="p-2"><input type="checkbox" checked={row.optional} onChange={e=>setForm((f:any)=>{ const items=[...f.items]; items[idx]={...row, optional:e.target.checked}; return {...f, items}; })}/></td>
											<td className="p-2"><input className="w-24 border rounded px-2 py-1" type="number" value={row.quantity} onChange={e=>setForm((f:any)=>{ const items=[...f.items]; items[idx]={...row, quantity:Number(e.target.value)}; return {...f, items}; })}/></td>
											<td className="p-2">${unit.toFixed(2)}</td>
											<td className="p-2">${subtotal.toFixed(2)}</td>
										</tr>
								);
								})}
							</tbody>
						</table>
					</div>
					<div className="text-right text-sm font-medium">Total materiales: ${ (form.items.reduce((acc:number, r:any, i:number)=> acc + ((r.quantity ?? 0) * (pieces[i]?.priceCordoba ?? 0)), 0)).toFixed(2) }</div>
					<button className="rounded bg-black text-white px-4 py-2" onClick={()=>setStep(3)}>Siguiente</button>
				</section>
			)}
			{step===3 && (
				<section>
					<h2 className="font-medium">3) Cálculo de Distancias</h2>
					<p className="text-sm text-muted-foreground">(Integración con Google Maps API)</p>
					<button className="rounded bg-black text-white px-4 py-2" onClick={()=>setStep(4)}>Siguiente</button>
				</section>
			)}
			{step===4 && (
				<section>
					<h2 className="font-medium">4) Costos Adicionales</h2>
					<p className="text-sm text-muted-foreground">(Montaje, grúa, etc.)</p>
					<button className="rounded bg-black text-white px-4 py-2" onClick={()=>setStep(5)}>Siguiente</button>
				</section>
			)}
			{step===5 && (
				<section>
					<h2 className="font-medium">5) Condiciones Comerciales</h2>
					<p className="text-sm text-muted-foreground">(Moneda, pagos, validez, IVA)</p>
					<button className="rounded bg-black text-white px-4 py-2" onClick={()=>setStep(6)}>Siguiente</button>
				</section>
			)}
			{step===6 && (
				<section>
					<h2 className="font-medium">6) Seguimiento</h2>
					<p className="text-sm text-muted-foreground">(Estados, timeline y observaciones)</p>
					{!createdId ? (
						<button disabled={creating} className="rounded bg-green-600 text-white px-4 py-2" onClick={createBudget}>{creating?"Creando...":"Crear Presupuesto"}</button>
					) : (
						<div className="mt-4 flex items-center gap-3">
							<a className="rounded bg-black text-white px-4 py-2" href={`/api/budgets/${createdId}/export/pdf`} target="_blank" rel="noopener noreferrer">Exportar PDF</a>
							<a className="rounded bg-black text-white px-4 py-2" href={`/api/budgets/${createdId}/export/excel`} target="_blank" rel="noopener noreferrer">Exportar Excel</a>
						</div>
					)}
				</section>
			)}
		</div>
	);
}