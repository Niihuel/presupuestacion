"use client";

import useSWR from "swr";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectCreateSchema, projectUpdateSchema, formatters } from "@/lib/validations/projects";
import useSWRImmutable from "swr/immutable";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RowActions } from "@/components/ui/row-actions";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Briefcase, AlertCircle, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";
import { usePermissionGuard } from "@/hooks/use-permission-guard";
import { PageTransition, SectionTransition, CardTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

// Add CSS for hiding scrollbars
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject CSS styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = scrollbarHideStyles;
  if (!document.head.querySelector('[data-scrollbar-hide]')) {
    styleSheet.setAttribute('data-scrollbar-hide', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default function ObrasPage() {
	const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
	const { guardAction } = usePermissionGuard();
	const [page, setPage] = React.useState(1);
	const [q, setQ] = React.useState("");
	const [sortBy, setSortBy] = React.useState("createdAt");
	const [sortDir, setSortDir] = React.useState<"asc"|"desc">("desc");
	const { data, mutate, isLoading } = useSWR(`/api/projects?page=${page}&pageSize=10&q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}`, fetcher);
	const customers = useSWRImmutable("/api/customers", fetcher).data?.items ?? [];
	
	// Create form with validation
	const createForm = useForm({
		resolver: zodResolver(projectCreateSchema),
		defaultValues: {
			customerId: '',
			name: '',
			description: '',
			address: '',
			city: '',
			province: '',
			postalCode: '',
			googleMapsUrl: ''
		}
	});
	
	// Edit form with validation
	const editForm = useForm({
		resolver: zodResolver(projectUpdateSchema)
	});

	const [openCreate, setOpenCreate] = React.useState(false);
	const [viewItem, setViewItem] = React.useState<any|null>(null);
	const [editItem, setEditItem] = React.useState<any|null>(null);
	const [deleteItem, setDeleteItem] = React.useState<any|null>(null);
	
	// Set edit form values when editItem changes
	React.useEffect(() => {
		if (editItem) {
			editForm.reset({
				customerId: editItem.customerId || '',
				name: editItem.name || '',
				description: editItem.description || '',
				address: editItem.address || '',
				city: editItem.city || '',
				province: editItem.province || '',
				postalCode: editItem.postalCode || '',
				googleMapsUrl: editItem.googleMapsUrl || ''
			});
		}
	}, [editItem, editForm]);

	// Error display component
	const ErrorMessage = ({ error }: { error?: string }) => {
		if (!error) return null;
		return (
			<div className="flex items-center gap-1 text-red-500 text-xs mt-1">
				<AlertCircle className="h-3 w-3" />
				<span>{error}</span>
			</div>
		);
	};

	const onSubmit = async (values: any) => {
		try {
			await axios.post("/api/projects", values);
			toast.success("Obra creada correctamente");
			createForm.reset();
			mutate();
			setOpenCreate(false);
		} catch (error: any) {
			handlePermissionError(error, "Crear obra");
		}
	};

	const onUpdate = async (values: any) => {
		if (!editItem) return;
		try {
			await axios.put(`/api/projects/${editItem.id}`, values);
			toast.success("Obra actualizada correctamente");
			mutate();
			setEditItem(null);
		} catch (error: any) {
			handlePermissionError(error, "Actualizar obra");
		}
	};

	async function onConfirmDelete(){
		if(!deleteItem) return;
		try {
			await axios.delete(`/api/projects/${deleteItem.id}`);
			toast.success("Obra eliminada correctamente");
			mutate();
			setDeleteItem(null);
		} catch (error: any) {
			handlePermissionError(error, "Eliminar obra");
		}
	}
	
	// Input formatter handlers
	const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.name(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleAddressInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.address(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.city(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleProvinceInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.province(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handlePostalCodeInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.postalCode(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleDescriptionInput = (e: React.ChangeEvent<HTMLTextAreaElement>, form: any, fieldName: string) => {
		const formatted = formatters.description(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleGoogleMapsUrlInput = (e: React.ChangeEvent<HTMLTextAreaElement>, form: any, fieldName: string) => {
		const formatted = formatters.googleMapsUrl(e.target.value);
		form.setValue(fieldName, formatted);
	};

	const items = (data?.items ?? []) as any[];

	return (
		<PageTransition>
			{/* Header Card */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="glass-card p-6 mb-6"
			>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-3">
						<div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
							<Briefcase className="h-6 w-6 text-[var(--accent-primary)]" />
								</div>
								<div>
							<h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Obras</h1>
							<p className="text-[var(--text-secondary)] mt-1">
								Administra las obras y su información asociada
							</p>
									</div>
								</div>
								</div>
				</motion.div>

			{/* Filtros */}
			<SectionTransition delay={0.1} className="mb-6">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<Input value={q} onChange={e=>{setPage(1); setQ(e.target.value)}} placeholder="Buscar obra..." className="max-w-sm" />
							<div className="flex gap-2">
								<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
									<Button variant="outline" onClick={() => setQ("")}
										className="transition-all duration-200">
										Limpiar filtros
									</Button>
								</motion.div>
								<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
									<Button onClick={guardAction("projects", "create", () => setOpenCreate(true), {
										customMessage: "Necesitas permisos para crear obras. Contacta al administrador del sistema."
									})}>
										<Plus className="w-4 h-4 mr-2" />
										Nueva Obra
									</Button>
								</motion.div>
							</div>
						</div>
					</CardContent>
				</Card>
			</SectionTransition>

			{/* Lista de obras */}
			<Card>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 dark:bg-neutral-900 border-b">
							<tr>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("name"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Nombre {sortBy==="name" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 font-semibold">Cliente</th>
								<th className="text-left p-4 font-semibold">Dirección</th>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("city"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Ciudad {sortBy==="city" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 font-semibold">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr><td className="p-8 text-center text-muted-foreground" colSpan={5}>Cargando...</td></tr>
							) : (items.length ? (
								(items).map((item: any, index: number) => (
									<tr key={item.id} className="border-b hover:bg-muted/50">
										<td className="p-4">{item.name}</td>
										<td className="p-4">{item.customer?.displayName ?? item.customer?.companyName ?? "-"}</td>
										<td className="p-4">{item.address ?? "-"}</td>
										<td className="p-4">{item.city ?? "-"}</td>
										<td className="p-4">
											<RowActions 
												onView={guardAction("projects", "view", () => setViewItem(item), {
													customMessage: "Necesitas permisos para ver detalles de obras."
												})} 
												onEdit={guardAction("projects", "edit", () => setEditItem(item), {
													customMessage: "Necesitas permisos para editar obras."
												})} 
												onDelete={guardAction("projects", "delete", () => setDeleteItem(item), {
													customMessage: "Necesitas permisos para eliminar obras."
												})} 
											/>
										</td>
									</tr>
								))
							) : (
								<tr><td className="p-8 text-center text-muted-foreground" colSpan={5}>
									<Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
									<p className="mb-4">No se encontraron obras</p>
									<Button onClick={guardAction("projects", "create", () => setOpenCreate(true), {
													customMessage: "Necesitas permisos para crear obras. Contacta al administrador del sistema."
									})}>
												<Plus className="w-4 h-4 mr-2" />
												Crear primera obra
											</Button>
								</td></tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
			</Card>

			{/* Paginación */}
			{(items.length > 0) && (
				<Pagination
					currentPage={page}
					hasNextPage={items.length >= 10}
					onPageChange={setPage}
				/>
			)}

			{/* Create Modal */}
			<UnifiedModal open={openCreate} onOpenChange={setOpenCreate}>
				<div className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-6">Crear Nueva Obra</h2>
						<form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<Label>Cliente *</Label>
						<Select {...createForm.register("customerId")}>
							<option value="">Seleccione...</option>
							{customers.map((c: any) => (
								<option key={c.id} value={c.id}>{c.companyName}</option>
							))}
						</Select>
						<ErrorMessage error={createForm.formState.errors.customerId?.message} />
					</div>
					
					<div>
						<Label>Nombre *</Label>
						<Input 
							{...createForm.register("name")}
							onChange={(e) => handleNameInput(e, createForm, "name")}
							placeholder="Ej: Edificio Residencial Centro"
							maxLength={200}
						/>
						<ErrorMessage error={createForm.formState.errors.name?.message} />
					</div>
					
					<div>
						<Label>Descripción</Label>
						<textarea 
							{...createForm.register("description")}
							onChange={(e) => handleDescriptionInput(e, createForm, "description")}
							placeholder="Descripción del proyecto..."
							maxLength={2000}
							rows={3}
							className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
						/>
						<ErrorMessage error={createForm.formState.errors.description?.message} />
					</div>
					
					<div>
						<Label>Dirección</Label>
						<Input 
							{...createForm.register("address")}
							onChange={(e) => handleAddressInput(e, createForm, "address")}
							placeholder="Ej: Av. Corrientes 1234"
							maxLength={255}
						/>
						<ErrorMessage error={createForm.formState.errors.address?.message} />
					</div>
					
					<div className="grid grid-cols-3 gap-4">
						<div>
							<Label>Ciudad</Label>
							<Input 
								{...createForm.register("city")}
								onChange={(e) => handleCityInput(e, createForm, "city")}
								placeholder="Ej: Córdoba"
								maxLength={120}
							/>
							<ErrorMessage error={createForm.formState.errors.city?.message} />
						</div>
						<div>
							<Label>Provincia</Label>
							<Input 
								{...createForm.register("province")}
								onChange={(e) => handleProvinceInput(e, createForm, "province")}
								placeholder="Ej: Córdoba"
								maxLength={120}
							/>
							<ErrorMessage error={createForm.formState.errors.province?.message} />
						</div>
						<div>
							<Label>Código Postal</Label>
							<Input 
								{...createForm.register("postalCode")}
								onChange={(e) => handlePostalCodeInput(e, createForm, "postalCode")}
								placeholder="1234 o A1234ABC"
								maxLength={8}
							/>
							<ErrorMessage error={createForm.formState.errors.postalCode?.message} />
						</div>
					</div>
									
					<div>
						<Label>Google Maps</Label>
						<textarea 
							{...createForm.register("googleMapsUrl")}
							onChange={(e) => handleGoogleMapsUrlInput(e, createForm, "googleMapsUrl")}
							placeholder="Pega aquí el código iframe de Google Maps o la URL..."
							rows={3}
							className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
						/>
						<ErrorMessage error={createForm.formState.errors.googleMapsUrl?.message} />
						<p className="text-xs text-muted-foreground mt-1">
							Puedes pegar el código iframe completo de Google Maps o solo la URL de inserción
						</p>
					</div>
					
							<div className="flex justify-end gap-2 mt-6">
								<Button type="button" variant="outline" onClick={() => {setOpenCreate(false); createForm.reset();}}>
									Cancelar
								</Button>
								<Button type="submit" disabled={createForm.formState.isSubmitting}>
									{createForm.formState.isSubmitting ? 'Creando...' : 'Crear'}
								</Button>
							</div>
						</form>
					</div>
				</div>
			</UnifiedModal>

			{/* View Modal */}
			<UnifiedModal open={!!viewItem} onOpenChange={(o)=>!o && setViewItem(null)}>
				<div className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-6">Detalles de la Obra</h2>
						{viewItem && (
							<div className="space-y-6">
						{/* Header with project name */}
						<div className="text-center pb-4 border-b">
							<h3 className="text-xl font-semibold text-[var(--text-primary)]">
								{viewItem.name}
							</h3>
							<p className="text-sm text-[var(--text-secondary)] mt-1">
								Obra #{viewItem.id?.slice(-8) || 'N/A'}
							</p>
						</div>

						{/* Project Information */}
						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-4">
								<h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
									<Briefcase className="h-4 w-4" />
									Información de la Obra
								</h4>
								<div className="space-y-3">
									<div>
										<span className="text-sm font-medium text-[var(--text-secondary)]">Cliente:</span>
										<p className="text-[var(--text-primary)]">{customers.find((c:any)=>c.id===viewItem.customerId)?.companyName || 'No asignado'}</p>
									</div>
									{viewItem.description && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Descripción:</span>
											<p className="text-[var(--text-primary)]">{viewItem.description}</p>
										</div>
									)}
									{viewItem.status && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Estado:</span>
											<p className="text-[var(--text-primary)]">{viewItem.status}</p>
										</div>
									)}
								</div>
							</div>

							<div className="space-y-4">
								<h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
									<Users className="h-4 w-4" />
									Ubicación
								</h4>
								<div className="space-y-3">
									{viewItem.address && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Dirección:</span>
											<p className="text-[var(--text-primary)]">{viewItem.address}</p>
										</div>
									)}
									{viewItem.city && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Ciudad:</span>
											<p className="text-[var(--text-primary)]">{viewItem.city}</p>
										</div>
									)}
									{viewItem.province && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Provincia:</span>
											<p className="text-[var(--text-primary)]">{viewItem.province}</p>
										</div>
									)}
									{viewItem.postalCode && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Código Postal:</span>
											<p className="text-[var(--text-primary)]">{viewItem.postalCode}</p>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Address Information */}
						{(viewItem.address || viewItem.city || viewItem.province || viewItem.postalCode) && (
							<div className="space-y-4">
								<h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
									<Users className="h-4 w-4" />
									Resumen de Ubicación
								</h4>
								<div className="bg-[var(--surface-secondary)] p-4 rounded-lg">
									<div className="space-y-2">
										{viewItem.address && (
											<p className="text-[var(--text-primary)]">{viewItem.address}</p>
										)}
										<div className="flex gap-4 text-sm">
											{viewItem.city && (
												<span>{viewItem.city}</span>
											)}
											{viewItem.province && (
												<span>• {viewItem.province}</span>
											)}
											{viewItem.postalCode && (
												<span>• CP: {viewItem.postalCode}</span>
											)}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Google Maps Section */}
						{viewItem.googleMapsUrl && (
							<div className="space-y-4">
								<h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
									<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
									</svg>
									Ubicación en el Mapa
								</h4>
								<div className="rounded-lg overflow-hidden border">
									<iframe
										src={(() => {
											// If it's an iframe tag, extract the src
											if (viewItem.googleMapsUrl.includes('<iframe')) {
												const srcMatch = viewItem.googleMapsUrl.match(/src="([^"]+)"/i);
												return srcMatch ? srcMatch[1] : '';
											}
											// If it's already a direct embed URL
											if (viewItem.googleMapsUrl.includes('maps/embed')) {
												return viewItem.googleMapsUrl;
											}
											// Otherwise return as is
											return viewItem.googleMapsUrl;
										})()}
										width="100%"
										height="300"
										style={{ border: 0 }}
										allowFullScreen
										loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
										title={`Mapa de ${viewItem.name}`}
									>
									</iframe>
								</div>
								<div className="flex gap-2">
									<a 
										href={(() => {
											// Extract the src URL for external link
											let mapUrl = viewItem.googleMapsUrl;
											if (mapUrl.includes('<iframe')) {
												const srcMatch = mapUrl.match(/src="([^"]+)"/i);
												mapUrl = srcMatch ? srcMatch[1] : mapUrl;
											}
											// Convert embed URL to regular Google Maps URL
											if (mapUrl.includes('maps/embed')) {
												return mapUrl.replace('/maps/embed', '/maps');
											}
											return mapUrl;
										})()} 
										target="_blank" 
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
									>
										<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
											<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
										</svg>
										Abrir en Google Maps
									</a>
								</div>
							</div>
						)}

						{/* Metadata */}
						<div className="pt-4 border-t">
							<div className="grid grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
								<div>
									<span className="font-medium">Creada:</span>
									<p>{viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleDateString('es-ES', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									}) : 'No disponible'}</p>
								</div>
								<div>
									<span className="font-medium">ID:</span>
									<p className="font-mono text-xs">{viewItem.id}</p>
								</div>
							</div>
						</div>
							</div>
						)}
						<div className="flex justify-end gap-2 mt-6">
							<Button variant="outline" onClick={() => setViewItem(null)}>
								Cerrar
							</Button>
							{viewItem && (
								<Button onClick={guardAction("projects", "edit", () => {
									setEditItem(viewItem);
									setViewItem(null);
								}, {
									customMessage: "Necesitas permisos para editar obras."
								})}>
									Editar
								</Button>
							)}
						</div>
					</div>
				</div>
			</UnifiedModal>
			{/* Edit Modal */}
			<UnifiedModal open={!!editItem} onOpenChange={(o)=>!o && setEditItem(null)}>
				<div className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-6">Editar Obra</h2>
						{editItem && (
					<form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
						<div>
							<Label>Cliente *</Label>
							<Select {...editForm.register("customerId")}>
								<option value="">Seleccione...</option>
								{customers.map((c: any) => (
									<option key={c.id} value={c.id}>{c.companyName}</option>
								))}
							</Select>
							<ErrorMessage error={editForm.formState.errors.customerId?.message} />
						</div>
						
						<div>
							<Label>Nombre *</Label>
							<Input
								{...editForm.register("name")}
								onChange={(e) => handleNameInput(e, editForm, "name")}
								placeholder="Ej: Edificio Residencial Centro"
								maxLength={200}
							/>
							<ErrorMessage error={editForm.formState.errors.name?.message} />
						</div>
						
						<div>
							<Label>Descripción</Label>
							<textarea
								{...editForm.register("description")}
								onChange={(e) => handleDescriptionInput(e, editForm, "description")}
								placeholder="Descripción del proyecto..."
								maxLength={2000}
								rows={3}
								className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
							/>
							<ErrorMessage error={editForm.formState.errors.description?.message} />
						</div>
						
						<div>
							<Label>Dirección</Label>
							<Input 
								{...editForm.register("address")}
								onChange={(e) => handleAddressInput(e, editForm, "address")}
								placeholder="Ej: Av. Corrientes 1234"
								maxLength={255}
							/>
							<ErrorMessage error={editForm.formState.errors.address?.message} />
						</div>
						
						<div className="grid grid-cols-3 gap-4">
							<div>
								<Label>Ciudad</Label>
								<Input
									{...editForm.register("city")}
									onChange={(e) => handleCityInput(e, editForm, "city")}
									placeholder="Ej: Córdoba"
									maxLength={120}
								/>
								<ErrorMessage error={editForm.formState.errors.city?.message} />
							</div>
							<div>
								<Label>Provincia</Label>
								<Input
									{...editForm.register("province")}
									onChange={(e) => handleProvinceInput(e, editForm, "province")}
									placeholder="Ej: Córdoba"
									maxLength={120}
								/>
								<ErrorMessage error={editForm.formState.errors.province?.message} />
							</div>
							<div>
								<Label>Código Postal</Label>
								<Input
									{...editForm.register("postalCode")}
									onChange={(e) => handlePostalCodeInput(e, editForm, "postalCode")}
									placeholder="1234 o A1234ABC"
									maxLength={8}
								/>
								<ErrorMessage error={editForm.formState.errors.postalCode?.message} />
							</div>
						</div>
											
						<div>
							<Label>Google Maps</Label>
							<textarea
								{...editForm.register("googleMapsUrl")}
								onChange={(e) => handleGoogleMapsUrlInput(e, editForm, "googleMapsUrl")}
								placeholder="Pega aquí el código iframe de Google Maps o la URL..."
								rows={3}
								className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
							/>
							<ErrorMessage error={editForm.formState.errors.googleMapsUrl?.message} />
							<p className="text-xs text-muted-foreground mt-1">
								Puedes pegar el código iframe completo de Google Maps o solo la URL de inserción
							</p>
						</div>
						
								<div className="flex justify-end gap-2 mt-6">
							<Button type="button" variant="outline" onClick={() => setEditItem(null)}>
								Cancelar
							</Button>
							<Button type="submit" disabled={editForm.formState.isSubmitting}>
										{editForm.formState.isSubmitting ? 'Actualizando...' : 'Actualizar'}
							</Button>
								</div>
							</form>
						)}
									</div>
								</div>
			</UnifiedModal>
			{/* Delete Confirmation Modal */}
			<UnifiedModal open={!!deleteItem} onOpenChange={(o)=>!o && setDeleteItem(null)}>
				<div className="max-w-md mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-4">Confirmar eliminación</h2>
						<p className="text-muted-foreground mb-6">
							¿Estás seguro de que deseas eliminar la obra <strong>{deleteItem?.name}</strong>? Esta acción no se puede deshacer.
						</p>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setDeleteItem(null)}>
									Cancelar
								</Button>
								<Button variant="destructive" onClick={onConfirmDelete}>
									Eliminar
								</Button>
						</div>
					</div>
				</div>
			</UnifiedModal>
			
			{/* Permission Error Modal */}
			<PermissionErrorModal />
		</PageTransition>
	);
}


