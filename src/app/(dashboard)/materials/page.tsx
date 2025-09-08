"use client";

import useSWR from "swr";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { materialCreateSchema, materialUpdateSchema, formatters, MATERIAL_CATEGORIES, MATERIAL_UNITS } from "@/lib/validations/materials";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RowActions } from "@/components/ui/row-actions";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Package, AlertCircle } from "lucide-react";
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

export default function MaterialsPage() {
	const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
	const { guardAction } = usePermissionGuard();
	const [page, setPage] = React.useState(1);
	const [q, setQ] = React.useState("");
	const [categoryFilter, setCategoryFilter] = React.useState("");
	const [sortBy, setSortBy] = React.useState("name");
	const [sortDir, setSortDir] = React.useState<"asc"|"desc">("asc");
	const { data, mutate, isLoading } = useSWR(`/api/materials?page=${page}&pageSize=10&q=${encodeURIComponent(q)}&category=${categoryFilter}&sortBy=${sortBy}&sortDir=${sortDir}`, fetcher);
	
	// Create form with validation
	const createForm = useForm({
		resolver: zodResolver(materialCreateSchema),
		defaultValues: {
			code: '',
			name: '',
			category: '' as any,
			unit: '' as any,
			currentPrice: 0,
			supplier: '',
			minimumStock: 0,
			active: true
		}
	});
	
	// Edit form with validation
	const editForm = useForm({
		resolver: zodResolver(materialUpdateSchema)
	});

	const [openCreate, setOpenCreate] = React.useState(false);
	const [viewItem, setViewItem] = React.useState<any|null>(null);
	const [editItem, setEditItem] = React.useState<any|null>(null);
	const [deleteItem, setDeleteItem] = React.useState<any|null>(null);
	
	// Set edit form values when editItem changes
	React.useEffect(() => {
		if (editItem) {
			editForm.reset({
				code: editItem.code || '',
				name: editItem.name || '',
				category: editItem.category || '',
				unit: editItem.unit || '',
				currentPrice: editItem.currentPrice || 0,
				supplier: editItem.supplier || '',
				minimumStock: editItem.minimumStock || 0,
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
			await axios.post("/api/materials", values);
			toast.success("Material creado correctamente");
			createForm.reset();
			mutate();
			setOpenCreate(false);
		} catch (error: any) {
			handlePermissionError(error, "Crear material");
		}
	};

	const onUpdate = async (values: any) => {
		if (!editItem) return;
		try {
			await axios.patch(`/api/materials/${editItem.id}`, values);
			toast.success("Material actualizado correctamente");
			mutate();
			setEditItem(null);
		} catch (error: any) {
			handlePermissionError(error, "Actualizar material");
		}
	};

	async function onConfirmDelete(){
		if(!deleteItem) return;
		try {
			await axios.delete(`/api/materials/${deleteItem.id}`);
			toast.success("Material eliminado correctamente");
			mutate();
			setDeleteItem(null);
		} catch (error: any) {
			handlePermissionError(error, "Eliminar material");
		}
	}
	
	// Input formatter handlers
	const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.code(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.name(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleSupplierInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.supplier(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.currentPrice(e.target.value);
		form.setValue(fieldName, parseFloat(formatted) || 0);
	};
	
	const handleStockInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.minimumStock(e.target.value);
		form.setValue(fieldName, parseInt(formatted) || 0);
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "hormigon": return "bg-gray-500";
			case "acero": return "bg-blue-500";
			case "aditivo": return "bg-purple-500";
			case "accesorio": return "bg-green-500";
			case "energia": return "bg-red-500";
			default: return "bg-gray-400";
		}
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
							<Package className="h-6 w-6 text-[var(--accent-primary)]" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Materiales</h1>
							<p className="text-[var(--text-secondary)] mt-1">
								Administra los materiales, precios y stock para la producción
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
							<div className="flex gap-2">
								<Input value={q} onChange={e=>{setPage(1); setQ(e.target.value)}} placeholder="Buscar material..." className="max-w-sm"/>
								<Select value={categoryFilter} onValueChange={(value) => {setPage(1); setCategoryFilter(value);}}>
									<Select.Trigger className="w-48">
										<Select.Value placeholder="Filtrar por categoría" />
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">Todas las categorías</Select.Item>
										{MATERIAL_CATEGORIES.map((cat: any) => (
											<Select.Item key={cat.value} value={cat.value}>
												{cat.label}
											</Select.Item>
										))}
									</Select.Content>
								</Select>
							</div>
							<div className="flex gap-2">
								<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
									<Button variant="outline" onClick={() => {setQ(""); setCategoryFilter("");}}
										className="transition-all duration-200">
										Limpiar filtros
									</Button>
								</motion.div>
								<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
									<Button onClick={guardAction("materials", "create", () => setOpenCreate(true), {
										customMessage: "Necesitas permisos para crear materiales. Contacta al administrador del sistema."
									})}>
										<Plus className="w-4 h-4 mr-2" />
										Nuevo Material
									</Button>
								</motion.div>
							</div>
						</div>
					</CardContent>
				</Card>
			</SectionTransition>

			{/* Lista de materiales */}
			<Card>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 dark:bg-neutral-900 border-b">
							<tr>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("code"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Código {sortBy==="code" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("name"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Nombre {sortBy==="name" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 font-semibold">Categoría</th>
								<th className="text-left p-4 font-semibold">Unidad</th>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("currentPrice"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Precio {sortBy==="currentPrice" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 font-semibold">Stock Mínimo</th>
								<th className="text-left p-4 font-semibold">Estado</th>
								<th className="text-left p-4 font-semibold">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr><td className="p-8 text-center text-muted-foreground" colSpan={8}>Cargando...</td></tr>
							) : (items.length ? (
								(items).map((item: any, index: number) => (
									<tr key={item.id} className="border-b hover:bg-muted/50">
										<td className="p-4 font-mono">{item.code}</td>
										<td className="p-4">{item.name}</td>
										<td className="p-4">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getCategoryColor(item.category)}`}>
												{MATERIAL_CATEGORIES.find((c: any) => c.value === item.category)?.label || item.category}
											</span>
										</td>
										<td className="p-4">{MATERIAL_UNITS.find((u: any) => u.value === item.unit)?.label || item.unit}</td>
										<td className="p-4">${item.currentPrice?.toFixed(2) || "0.00"}</td>
										<td className="p-4">{item.minimumStock || "0"}</td>
										<td className="p-4">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												item.active 
													? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
													: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
											}`}>
												{item.active ? "Activo" : "Inactivo"}
											</span>
										</td>
										<td className="p-4">
											<RowActions 
												onView={guardAction("materials", "view", () => setViewItem(item), {
													customMessage: "Necesitas permisos para ver detalles de materiales."
												})} 
												onEdit={guardAction("materials", "edit", () => setEditItem(item), {
													customMessage: "Necesitas permisos para editar materiales."
												})} 
												onDelete={guardAction("materials", "delete", () => setDeleteItem(item), {
													customMessage: "Necesitas permisos para eliminar materiales."
												})} 
											/>
										</td>
									</tr>
								))
							) : (
								<tr><td className="p-8 text-center text-muted-foreground" colSpan={8}>
									<Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
									<p className="mb-4">No se encontraron materiales</p>
									<Button onClick={guardAction("materials", "create", () => setOpenCreate(true), {
										customMessage: "Necesitas permisos para crear materiales. Contacta al administrador del sistema."
									})}>
										<Plus className="w-4 h-4 mr-2" />
										Crear primer material
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
						<h2 className="text-xl font-semibold mb-6">Crear Nuevo Material</h2>
						<form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="create-code">Código *</Label>
									<Input
										id="create-code"
										placeholder="Ej: HOR001"
										value={createForm.watch('code')}
										onChange={e => handleCodeInput(e, createForm, 'code')}
									/>
									<ErrorMessage error={createForm.formState.errors.code?.message} />
								</div>
								<div>
									<Label htmlFor="create-category">Categoría *</Label>
									<Select
										id="create-category"
										{...createForm.register("category")}
									>
										<option value="">Seleccione...</option>
										{MATERIAL_CATEGORIES.map((cat) => (
											<option key={cat.value} value={cat.value}>
												{cat.label}
											</option>
										))}
									</Select>
									<ErrorMessage error={createForm.formState.errors.category?.message} />
								</div>
							</div>
							<div>
								<Label htmlFor="create-name">Nombre *</Label>
								<Input
									id="create-name"
									placeholder="Ingrese el nombre del material"
									value={createForm.watch('name')}
									onChange={e => handleNameInput(e, createForm, 'name')}
								/>
								<ErrorMessage error={createForm.formState.errors.name?.message} />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="create-unit">Unidad *</Label>
									<Select
										id="create-unit"
										{...createForm.register("unit")}
									>
										<option value="">Seleccione...</option>
										{MATERIAL_UNITS.map((unit) => (
											<option key={unit} value={unit}>
												{unit}
											</option>
										))}
									</Select>
									<ErrorMessage error={createForm.formState.errors.unit?.message} />
								</div>
								<div>
									<Label htmlFor="create-currentPrice">Precio Actual *</Label>
									<Input
										id="create-currentPrice"
										placeholder="0.00"
										value={createForm.watch('currentPrice')}
										onChange={e => handlePriceInput(e, createForm, 'currentPrice')}
									/>
									<ErrorMessage error={createForm.formState.errors.currentPrice?.message} />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="create-supplier">Proveedor</Label>
									<Input
										id="create-supplier"
										placeholder="Nombre del proveedor"
										value={createForm.watch('supplier') || ''}
										onChange={e => handleSupplierInput(e, createForm, 'supplier')}
									/>
									<ErrorMessage error={createForm.formState.errors.supplier?.message} />
								</div>
								<div>
									<Label htmlFor="create-minimumStock">Stock Mínimo</Label>
									<Input
										id="create-minimumStock"
										placeholder="0"
										value={createForm.watch('minimumStock')}
										onChange={e => handleStockInput(e, createForm, 'minimumStock')}
									/>
									<ErrorMessage error={createForm.formState.errors.minimumStock?.message} />
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="create-active"
									checked={createForm.watch('active')}
									onChange={e => createForm.setValue('active', e.target.checked)}
									className="w-4 h-4"
								/>
								<Label htmlFor="create-active">Material activo</Label>
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

			{/* Edit Modal */}
			<UnifiedModal open={!!editItem} onOpenChange={() => setEditItem(null)}>
				<div className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-6">Editar Material</h2>
						<form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="edit-code">Código *</Label>
									<Input
										id="edit-code"
										placeholder="Ej: HOR001"
										value={editForm.watch('code') || ''}
										onChange={e => handleCodeInput(e, editForm, 'code')}
									/>
									<ErrorMessage error={editForm.formState.errors.code?.message} />
								</div>
								<div>
									<Label htmlFor="edit-category">Categoría *</Label>
									<Select
										id="edit-category"
										{...editForm.register("category")}
									>
										<option value="">Seleccione...</option>
										{MATERIAL_CATEGORIES.map((cat) => (
											<option key={cat.value} value={cat.value}>
												{cat.label}
											</option>
										))}
									</Select>
									<ErrorMessage error={editForm.formState.errors.category?.message} />
								</div>
							</div>
							<div>
								<Label htmlFor="edit-name">Nombre *</Label>
								<Input
									id="edit-name"
									placeholder="Ingrese el nombre del material"
									value={editForm.watch('name') || ''}
									onChange={e => handleNameInput(e, editForm, 'name')}
								/>
								<ErrorMessage error={editForm.formState.errors.name?.message} />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="edit-unit">Unidad *</Label>
									<Select
										id="edit-unit"
										{...editForm.register("unit")}
									>
										<option value="">Seleccione...</option>
										{MATERIAL_UNITS.map((unit) => (
											<option key={unit} value={unit}>
												{unit}
											</option>
										))}
									</Select>
									<ErrorMessage error={editForm.formState.errors.unit?.message} />
								</div>
								<div>
									<Label htmlFor="edit-currentPrice">Precio Actual *</Label>
									<Input
										id="edit-currentPrice"
										placeholder="0.00"
										value={editForm.watch('currentPrice') || 0}
										onChange={e => handlePriceInput(e, editForm, 'currentPrice')}
									/>
									<ErrorMessage error={editForm.formState.errors.currentPrice?.message} />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="edit-supplier">Proveedor</Label>
									<Input
										id="edit-supplier"
										placeholder="Nombre del proveedor"
										value={editForm.watch('supplier') || ''}
										onChange={e => handleSupplierInput(e, editForm, 'supplier')}
									/>
									<ErrorMessage error={editForm.formState.errors.supplier?.message} />
								</div>
								<div>
									<Label htmlFor="edit-minimumStock">Stock Mínimo</Label>
									<Input
										id="edit-minimumStock"
										placeholder="0"
										value={editForm.watch('minimumStock') || 0}
										onChange={e => handleStockInput(e, editForm, 'minimumStock')}
									/>
									<ErrorMessage error={editForm.formState.errors.minimumStock?.message} />
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="edit-active"
									checked={editForm.watch('active')}
									onChange={e => editForm.setValue('active', e.target.checked)}
									className="w-4 h-4"
								/>
								<Label htmlFor="edit-active">Material activo</Label>
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

			{/* View Modal */}
			<UnifiedModal open={!!viewItem} onOpenChange={() => setViewItem(null)}>
				<div className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-6">Detalles del Material</h2>
						{viewItem && (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Código</Label>
										<p className="text-base font-mono">{viewItem.code}</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Estado</Label>
										<span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
											viewItem.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
										}`}>
											{viewItem.active ? "Activo" : "Inactivo"}
										</span>
									</div>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
									<p className="text-base font-medium">{viewItem.name}</p>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Categoría</Label>
										<span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(viewItem.category)}`}>
											{viewItem.category.charAt(0).toUpperCase() + viewItem.category.slice(1)}
										</span>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Unidad</Label>
										<p className="text-base">{viewItem.unit}</p>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Precio Actual</Label>
										<p className="text-base font-semibold">${viewItem.currentPrice?.toFixed(2) || '0.00'}</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Stock Mínimo</Label>
										<p className="text-base">{viewItem.minimumStock || 0}</p>
									</div>
								</div>
								{viewItem.supplier && (
									<div>
										<Label className="text-sm font-medium text-muted-foreground">Proveedor</Label>
										<p className="text-base">{viewItem.supplier}</p>
									</div>
								)}
							</div>
						)}
						<div className="flex justify-end gap-2 mt-6">
							<Button variant="outline" onClick={() => setViewItem(null)}>
								Cerrar
							</Button>
							{viewItem && (
								<Button onClick={guardAction("materials", "edit", () => {
									setEditItem(viewItem);
									setViewItem(null);
								}, {
									customMessage: "Necesitas permisos para editar materiales."
								})}>
									Editar
								</Button>
							)}
						</div>
					</div>
				</div>
			</UnifiedModal>

			{/* Delete Confirmation Modal */}
			<UnifiedModal open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
				<div className="max-w-md mx-auto">
					<div className="p-6">
						<h2 className="text-xl font-semibold mb-4">Confirmar eliminación</h2>
						<p className="text-muted-foreground mb-6">
							¿Estás seguro de que deseas eliminar el material <strong>{deleteItem?.name}</strong>? Esta acción no se puede deshacer.
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