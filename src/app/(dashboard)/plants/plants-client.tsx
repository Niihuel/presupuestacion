"use client";

import useSWR from "swr";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { plantCreateSchema, plantUpdateSchema, formatters } from "@/lib/validations/plants";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RowActions } from "@/components/ui/row-actions";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Factory, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";
import { useCan } from "@/hooks/use-can";
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

export default function PlantsClient() {
	const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
	const { can } = useCan();
	const { guardAction } = usePermissionGuard();
	const [page, setPage] = React.useState(1);
	const [q, setQ] = React.useState("");
	const [sortBy, setSortBy] = React.useState("name");
	const [sortDir, setSortDir] = React.useState<"asc"|"desc">("asc");
	const { data, mutate, isLoading } = useSWR(`/api/plants?page=${page}&pageSize=10&q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}`, fetcher);
	
	// Create form with validation
	const createForm = useForm({
		resolver: zodResolver(plantCreateSchema),
		defaultValues: {
			name: '',
			location: '',
			address: '',
			googleMapsUrl: '',
			active: true
		}
	});
	
	// Edit form with validation
	const editForm = useForm({
		resolver: zodResolver(plantUpdateSchema)
	});

	const [openCreate, setOpenCreate] = React.useState(false);
	const [viewItem, setViewItem] = React.useState<any|null>(null);
	const [editItem, setEditItem] = React.useState<any|null>(null);
	const [deleteItem, setDeleteItem] = React.useState<any|null>(null);
	
	// Set edit form values when editItem changes
	React.useEffect(() => {
		if (editItem) {
			editForm.reset({
				name: editItem.name || '',
				location: editItem.location || '',
				address: editItem.address || '',
				googleMapsUrl: editItem.googleMapsUrl || '',
				active: editItem.active ?? true
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
			await axios.post("/api/plants", values);
			toast.success("Planta creada correctamente");
			createForm.reset();
			mutate();
			setOpenCreate(false);
		} catch (error: any) {
			handlePermissionError(error, "Crear planta");
		}
	};

	const onUpdate = async (values: any) => {
		if (!editItem) return;
		try {
			await axios.put(`/api/plants/${editItem.id}`, values);
			toast.success("Planta actualizada correctamente");
			mutate();
			setEditItem(null);
		} catch (error: any) {
			handlePermissionError(error, "Actualizar planta");
		}
	};

	async function onConfirmDelete(){
		if(!deleteItem) return;
		try {
			await axios.delete(`/api/plants/${deleteItem.id}`);
			toast.success("Planta eliminada correctamente");
			mutate();
			setDeleteItem(null);
		} catch (error: any) {
			handlePermissionError(error, "Eliminar planta");
		}
	}
	
	// Input formatter handlers
	const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.name(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.location(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleAddressInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.address(e.target.value);
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
							<Factory className="h-6 w-6 text-[var(--accent-primary)]" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Plantas</h1>
							<p className="text-[var(--text-secondary)] mt-1">
								Administra las plantas de producción y sus configuraciones
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
							<Input value={q} onChange={e=>{setPage(1); setQ(e.target.value)}} placeholder="Buscar planta..." className="max-w-sm"/>
							<div className="flex gap-2">
								<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
									<Button variant="outline" onClick={() => setQ("")}
										className="transition-all duration-200">
										Limpiar filtros
									</Button>
								</motion.div>
								<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
									<Button onClick={guardAction("plants", "create", () => setOpenCreate(true), {
										customMessage: "Necesitas permisos para crear plantas. Contacta al administrador del sistema."
									})}>
										<Plus className="w-4 h-4 mr-2" />
										Nueva Planta
									</Button>
								</motion.div>
							</div>
						</div>
					</CardContent>
				</Card>
			</SectionTransition>

			{/* Lista de plantas */}
			<Card>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 dark:bg-neutral-900 border-b">
							<tr>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("name"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Nombre {sortBy==="name" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 font-semibold">Ubicación</th>
								<th className="text-left p-4 font-semibold">Dirección</th>
								<th className="text-left p-4 font-semibold">Estado</th>
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
										<td className="p-4">{item.location ?? "-"}</td>
										<td className="p-4">{item.address ?? "-"}</td>
										<td className="p-4">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												item.active 
													? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
													: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
											}`}>
												{item.active ? "Activa" : "Inactiva"}
											</span>
										</td>
										<td className="p-4">
											<RowActions 
												onView={guardAction("plants", "view", () => setViewItem(item), {
													customMessage: "Necesitas permisos para ver detalles de plantas."
												})} 
												onEdit={guardAction("plants", "edit", () => setEditItem(item), {
													customMessage: "Necesitas permisos para editar plantas."
												})} 
												onDelete={guardAction("plants", "delete", () => setDeleteItem(item), {
													customMessage: "Necesitas permisos para eliminar plantas."
												})} 
											/>
										</td>
									</tr>
								))
							) : (
								<tr><td className="p-8 text-center text-muted-foreground" colSpan={5}>
									<Factory className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
									<p className="mb-4">No se encontraron plantas</p>
									<Button onClick={guardAction("plants", "create", () => setOpenCreate(true), {
										customMessage: "Necesitas permisos para crear plantas. Contacta al administrador del sistema."
									})}>
										<Plus className="w-4 h-4 mr-2" />
										Crear primera planta
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

			{/* Create UnifiedModal */}
			<UnifiedModal open={openCreate} onOpenChange={setOpenCreate}>
				<div className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-6">Crear Nueva Planta</h2>
						<form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-4">
							<div>
								<Label htmlFor="create-name">Nombre *</Label>
								<Input
									id="create-name"
									placeholder="Ingrese el nombre de la planta"
									value={createForm.watch('name')}
									onChange={e => handleNameInput(e, createForm, 'name')}
								/>
								<ErrorMessage error={createForm.formState.errors.name?.message} />
							</div>
							<div>
								<Label htmlFor="create-location">Ubicación</Label>
								<Input
									id="create-location"
									placeholder="Ingrese la ubicación"
									value={createForm.watch('location')}
									onChange={e => handleLocationInput(e, createForm, 'location')}
								/>
								<ErrorMessage error={createForm.formState.errors.location?.message} />
							</div>
							<div>
								<Label htmlFor="create-address">Dirección</Label>
								<Input
									id="create-address"
									placeholder="Ingrese la dirección"
									value={createForm.watch('address')}
									onChange={e => handleAddressInput(e, createForm, 'address')}
								/>
								<ErrorMessage error={createForm.formState.errors.address?.message} />
							</div>
							<div>
								<Label htmlFor="create-googleMapsUrl">Google Maps (URL o código iframe)</Label>
								<textarea
									id="create-googleMapsUrl"
									className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-vertical min-h-[80px]"
									placeholder="Pegue aquí la URL de Google Maps o el código iframe completo"
									value={createForm.watch('googleMapsUrl') || ''}
									onChange={e => handleGoogleMapsUrlInput(e, createForm, 'googleMapsUrl')}
									rows={3}
								/>
								<ErrorMessage error={createForm.formState.errors.googleMapsUrl?.message} />
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="create-active"
									checked={createForm.watch('active')}
									onChange={e => createForm.setValue('active', e.target.checked)}
									className="w-4 h-4"
								/>
								<Label htmlFor="create-active">Planta activa</Label>
							</div>
							<div className="flex justify-end gap-2 mt-6">
								<Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
									Cancelar
								</Button>
								<Button type="submit" disabled={createForm.formState.isSubmitting}>
									{createForm.formState.isSubmitting ? "Creando..." : "Crear"}
								</Button>
							</div>
						</form>
					</div>
				</div>
			</UnifiedModal>

			{/* Edit UnifiedModal */}
			<UnifiedModal open={!!editItem} onOpenChange={() => setEditItem(null)}>
				<div className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-6">Editar Planta</h2>
						<form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
							<div>
								<Label htmlFor="edit-name">Nombre *</Label>
								<Input
									id="edit-name"
									placeholder="Ingrese el nombre de la planta"
									value={editForm.watch('name') || ''}
									onChange={e => handleNameInput(e, editForm, 'name')}
								/>
								<ErrorMessage error={editForm.formState.errors.name?.message} />
							</div>
							<div>
								<Label htmlFor="edit-location">Ubicación</Label>
								<Input
									id="edit-location"
									placeholder="Ingrese la ubicación"
									value={editForm.watch('location') || ''}
									onChange={e => handleLocationInput(e, editForm, 'location')}
								/>
								<ErrorMessage error={editForm.formState.errors.location?.message} />
							</div>
							<div>
								<Label htmlFor="edit-address">Dirección</Label>
								<Input
									id="edit-address"
									placeholder="Ingrese la dirección"
									value={editForm.watch('address') || ''}
									onChange={e => handleAddressInput(e, editForm, 'address')}
								/>
								<ErrorMessage error={editForm.formState.errors.address?.message} />
							</div>
							<div>
								<Label htmlFor="edit-googleMapsUrl">Google Maps (URL o código iframe)</Label>
								<textarea
									id="edit-googleMapsUrl"
									className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-vertical min-h-[80px]"
									placeholder="Pegue aquí la URL de Google Maps o el código iframe completo"
									value={editForm.watch('googleMapsUrl') || ''}
									onChange={e => handleGoogleMapsUrlInput(e, editForm, 'googleMapsUrl')}
									rows={3}
								/>
								<ErrorMessage error={editForm.formState.errors.googleMapsUrl?.message} />
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="edit-active"
									checked={editForm.watch('active')}
									onChange={e => editForm.setValue('active', e.target.checked)}
									className="w-4 h-4"
								/>
								<Label htmlFor="edit-active">Planta activa</Label>
							</div>
							<div className="flex justify-end gap-2 mt-6">
								<Button type="button" variant="outline" onClick={() => setEditItem(null)}>
									Cancelar
								</Button>
								<Button type="submit" disabled={editForm.formState.isSubmitting}>
									{editForm.formState.isSubmitting ? "Actualizando..." : "Actualizar"}
								</Button>
							</div>
						</form>
					</div>
				</div>
			</UnifiedModal>

			{/* View UnifiedModal */}
			<UnifiedModal open={!!viewItem} onOpenChange={() => setViewItem(null)}>
				<div className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-6">Detalles de la Planta</h2>
						{viewItem && (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
										<p className="text-base font-medium">{viewItem.name}</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Estado</Label>
										<span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
											viewItem.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
										}`}>
											{viewItem.active ? "Activa" : "Inactiva"}
										</span>
									</div>
								</div>
								{viewItem.location && (
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Ubicación</Label>
										<p className="text-base">{viewItem.location}</p>
									</div>
								)}
								{viewItem.address && (
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Dirección</Label>
										<p className="text-base">{viewItem.address}</p>
									</div>
								)}


								{viewItem.googleMapsUrl && (
									<div>
										<Label className="text-sm font-medium text-muted-foreground mb-2 block">Ubicación en Google Maps</Label>
										<div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
											<iframe
												src={(() => {
													// If it's iframe HTML, extract the src
													if (viewItem.googleMapsUrl.includes('<iframe')) {
														const srcMatch = viewItem.googleMapsUrl.match(/src="([^"]+)"/i);
														return srcMatch ? srcMatch[1] : '';
													}
													// Return the URL directly
													return viewItem.googleMapsUrl;
												})()}
												width="100%"
												height="100%"
												style={{ border: 0 }}
												allowFullScreen
												loading="lazy"
												referrerPolicy="no-referrer-when-downgrade"
												title="Google Maps"
											/>
										</div>
									</div>
								)}

							</div>
						)}
						<div className="flex justify-end gap-2 mt-6">
							<Button variant="outline" onClick={() => setViewItem(null)}>
								Cerrar
							</Button>
							{viewItem && (
								<Button onClick={guardAction("plants", "edit", () => {
									setEditItem(viewItem);
									setViewItem(null);
								}, {
									customMessage: "Necesitas permisos para editar plantas."
								})}>
									Editar
								</Button>
							)}
						</div>
					</div>
				</div>
			</UnifiedModal>

			{/* Delete Confirmation UnifiedModal */}
			<UnifiedModal open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
				<div className="max-w-md mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-4">Confirmar eliminación</h2>
						<p className="text-muted-foreground mb-6">
							¿Estás seguro de que deseas eliminar la planta <strong>{deleteItem?.name}</strong>? Esta acción no se puede deshacer.
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

			<PermissionErrorModal />
		</PageTransition>
	);
}