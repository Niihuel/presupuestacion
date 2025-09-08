"use client";

import * as React from "react";
import useSWR from "swr";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerCreateSchema, customerUpdateSchema, formatters } from "@/lib/validations/customers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { RowActions } from "@/components/ui/row-actions";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";
import { useCan } from "@/hooks/use-can";
import { usePermissionGuard } from "@/hooks/use-permission-guard";
import { PageTransition, SectionTransition, CardTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

export default function CustomersClient() {
	const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
	const { can } = useCan();
	const { guardAction } = usePermissionGuard();
	
	const [page, setPage] = React.useState(1 as number);
	const [sortBy, setSortBy] = React.useState("createdAt");
	const [sortDir, setSortDir] = React.useState<"asc"|"desc">("desc");
	const [q, setQ] = React.useState("");
	const { data, mutate, isLoading } = useSWR(`/api/customers?page=${page}&pageSize=10&sortBy=${sortBy}&sortDir=${sortDir}&q=${encodeURIComponent(q)}`, fetcher);
	
	// Create form with validation
	const createForm = useForm({
		resolver: zodResolver(customerCreateSchema),
		defaultValues: {
			displayName: '',
			companyName: '',
			taxId: '',
			address: '',
			city: '',
			province: '',
			postalCode: '',
			phone: '',
			email: '',
			contactPerson: '',
			activityType: '',
			customerType: ''
		}
	});
	
	// Edit form with validation
	const editForm = useForm({
		resolver: zodResolver(customerUpdateSchema)
	});
	
	const [open, setOpen] = React.useState(false);
	const [viewItem, setViewItem] = React.useState<any|null>(null);
	const [editItem, setEditItem] = React.useState<any|null>(null);
	const [deleteItem, setDeleteItem] = React.useState<any|null>(null);
	
	// Set edit form values when editItem changes
	React.useEffect(() => {
		if (editItem) {
			editForm.reset({
				displayName: editItem.displayName || '',
				companyName: editItem.companyName || '',
				taxId: editItem.taxId || '',
				address: editItem.address || '',
				city: editItem.city || '',
				province: editItem.province || '',
				postalCode: editItem.postalCode || '',
				phone: editItem.phone || '',
				email: editItem.email || '',
				contactPerson: editItem.contactPerson || '',
				activityType: editItem.activityType || '',
				customerType: editItem.customerType || ''
			});
		}
	}, [editItem, editForm]);

	const onSubmit = async (values: any) => {
		try {
			await axios.post("/api/customers", values);
			toast.success("Cliente creado correctamente");
			createForm.reset();
			mutate();
			setOpen(false);
		} catch (error: any) {
			handlePermissionError(error, "Crear cliente");
		}
	};

	const onUpdate = async (values: any) => {
		if (!editItem) return;
		try {
			await axios.put(`/api/customers/${editItem.id}`, values);
			toast.success("Cliente actualizado correctamente");
			mutate();
			setEditItem(null);
		} catch (error: any) {
			handlePermissionError(error, "Actualizar cliente");
		}
	};

	async function onConfirmDelete(){
		if(!deleteItem) return;
		try {
			await axios.delete(`/api/customers/${deleteItem.id}`);
			toast.success("Cliente eliminado correctamente");
			mutate();
			setDeleteItem(null);
		} catch (error: any) {
			handlePermissionError(error, "Eliminar cliente");
		}
	}
	
	// Input formatter handlers
	const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.phone(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleCuitInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.cuit(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handlePostalCodeInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.postalCode(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.name(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleAddressInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.address(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
	const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>, form: any, fieldName: string) => {
		const formatted = formatters.email(e.target.value);
		form.setValue(fieldName, formatted);
	};
	
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
							<Users className="h-6 w-6 text-[var(--accent-primary)]" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Clientes</h1>
							<p className="text-[var(--text-secondary)] mt-1">
								Administra la información de clientes y contactos
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
							<Input value={q} onChange={e=>{setPage(1); setQ(e.target.value)}} placeholder="Buscar cliente..." className="max-w-sm" />
							<div className="flex gap-2">
								<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
									<Button variant="outline" onClick={() => setQ("")}
										className="transition-all duration-200">
										Limpiar filtros
									</Button>
								</motion.div>
								<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
									<Button 
										onClick={() => {
											if (can.access("customers", "create")) {
												setOpen(true);
											} else {
												handlePermissionError(new Error("Insufficient permissions: customers:create"), "Crear clientes");
											}
										}}
										disabled={!can.access("customers", "create")}
									>
										<Plus className="w-4 h-4 mr-2" />
										Nuevo Cliente
									</Button>
								</motion.div>
							</div>
						</div>
					</CardContent>
				</Card>
			</SectionTransition>

			{/* Lista de clientes */}
			<Card>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 dark:bg-neutral-900 border-b">
							<tr>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("displayName"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Nombre {sortBy==="displayName" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 font-semibold">Dirección</th>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("city"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Ciudad {sortBy==="city" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("province"); setSortDir(sortDir==="asc"?"desc":"asc")}}>Provincia {sortBy==="province" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
								<th className="text-left p-4 font-semibold">Teléfono</th>
								<th className="text-left p-4 font-semibold">Email</th>
								<th className="text-left p-4 font-semibold">Contacto</th>
								<th className="text-left p-4 font-semibold">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr><td className="p-8 text-center text-muted-foreground" colSpan={8}>Cargando...</td></tr>
							) : (data?.items?.length ? (
								(data.items).map((c: any) => (
									<tr key={c.id} className="border-b hover:bg-muted/50">
										<td className="p-4">{c.displayName ?? c.companyName}</td>
										<td className="p-4">{c.address ?? "-"}</td>
										<td className="p-4">{c.city ?? "-"}</td>
										<td className="p-4">{c.province ?? "-"}</td>
										<td className="p-4">{c.phone ?? "-"}</td>
										<td className="p-4">{c.email ?? "-"}</td>
										<td className="p-4">{c.contactPerson ?? "-"}</td>
										<td className="p-4">
											<RowActions 
												onView={guardAction("customers", "view", () => setViewItem(c), {
													customMessage: "Necesitas permisos para ver detalles de clientes."
												})} 
												onEdit={guardAction("customers", "edit", () => setEditItem(c), {
													customMessage: "Necesitas permisos para editar clientes."
												})} 
												onDelete={guardAction("customers", "delete", () => setDeleteItem(c), {
													customMessage: "Necesitas permisos para eliminar clientes."
												})} 
											/>
										</td>
									</tr>
								))
							) : (
								<tr><td className="p-8 text-center text-muted-foreground" colSpan={8}>
									<Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
									<p className="mb-4">No se encontraron clientes</p>
									<Button onClick={guardAction("customers", "create", () => setOpen(true), {
										customMessage: "Necesitas permisos para crear clientes. Contacta al administrador del sistema."
									})}>
										<Plus className="w-4 h-4 mr-2" />
										Crear primer cliente
									</Button>
								</td></tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
			</Card>

			{/* Paginación */}
			{((data?.items?.length ?? 0) > 0) && (
				<Pagination
					currentPage={page}
					hasNextPage={(data?.items?.length ?? 0) >= 10}
					onPageChange={setPage}
				/>
			)}

			<UnifiedModal open={open} onOpenChange={setOpen} title="Nuevo Cliente" size="lg">
				<form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-4">
					{/* Company Name and Display Name */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>Nombre de Empresa *</Label>
							<Input 
								{...createForm.register("companyName")}
								onChange={(e) => handleAddressInput(e, createForm, "companyName")}
								placeholder="Ej: Constructora ABC S.A."
								maxLength={150}
							/>
							<ErrorMessage error={createForm.formState.errors.companyName?.message} />
						</div>
						<div>
							<Label>Nombre para Mostrar</Label>
							<Input 
								{...createForm.register("displayName")}
								onChange={(e) => handleNameInput(e, createForm, "displayName")}
								placeholder="Ej: Constructora ABC"
								maxLength={100}
							/>
							<ErrorMessage error={createForm.formState.errors.displayName?.message} />
						</div>
					</div>
					
					{/* Contact Information */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>Persona de Contacto</Label>
							<Input 
								{...createForm.register("contactPerson")}
								onChange={(e) => handleNameInput(e, createForm, "contactPerson")}
								placeholder="Ej: Juan Pérez"
								maxLength={100}
							/>
							<ErrorMessage error={createForm.formState.errors.contactPerson?.message} />
						</div>
						<div>
							<Label>CUIT/CUIL</Label>
							<Input 
								{...createForm.register("taxId")}
								onChange={(e) => handleCuitInput(e, createForm, "taxId")}
								placeholder="XX-XXXXXXXX-X"
								maxLength={13}
							/>
							<ErrorMessage error={createForm.formState.errors.taxId?.message} />
						</div>
					</div>
					
					{/* Address Information */}
					<div>
						<Label>Dirección</Label>
						<Input 
							{...createForm.register("address")}
							onChange={(e) => handleAddressInput(e, createForm, "address")}
							placeholder="Ej: Av. Corrientes 1234, Piso 5"
							maxLength={200}
						/>
						<ErrorMessage error={createForm.formState.errors.address?.message} />
					</div>
					
					<div className="grid grid-cols-3 gap-4">
						<div>
							<Label>Ciudad</Label>
							<Input 
								{...createForm.register("city")}
								onChange={(e) => handleNameInput(e, createForm, "city")}
								placeholder="Ej: Buenos Aires"
								maxLength={80}
							/>
							<ErrorMessage error={createForm.formState.errors.city?.message} />
						</div>
						<div>
							<Label>Provincia</Label>
							<Input 
								{...createForm.register("province")}
								onChange={(e) => handleNameInput(e, createForm, "province")}
								placeholder="Ej: Buenos Aires"
								maxLength={80}
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
					
					{/* Contact Details */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>Teléfono</Label>
							<Input 
								{...createForm.register("phone")}
								onChange={(e) => handlePhoneInput(e, createForm, "phone")}
								placeholder="11-2345-6789"
								maxLength={20}
							/>
							<ErrorMessage error={createForm.formState.errors.phone?.message} />
						</div>
						<div>
							<Label>Email</Label>
							<Input 
								{...createForm.register("email")}
								onChange={(e) => handleEmailInput(e, createForm, "email")}
								placeholder="contacto@empresa.com"
								maxLength={100}
							/>
							<ErrorMessage error={createForm.formState.errors.email?.message} />
						</div>
					</div>
					
					{/* Business Information */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>Tipo de Actividad</Label>
							<Input 
								{...createForm.register("activityType")}
								onChange={(e) => handleNameInput(e, createForm, "activityType")}
								placeholder="Ej: Construcción"
								maxLength={100}
							/>
							<ErrorMessage error={createForm.formState.errors.activityType?.message} />
						</div>
						<div>
							<Label>Tipo de Cliente</Label>
							<Input 
								{...createForm.register("customerType")}
								onChange={(e) => handleNameInput(e, createForm, "customerType")}
								placeholder="Ej: Empresarial"
								maxLength={100}
							/>
							<ErrorMessage error={createForm.formState.errors.customerType?.message} />
						</div>
					</div>
					
					<div className="flex gap-3 pt-4 border-t">
						<Button type="button" variant="outline" onClick={() => {setOpen(false); createForm.reset();}} className="flex-1">
							Cancelar
						</Button>
						<Button type="submit" className="flex-1" disabled={createForm.formState.isSubmitting}>
							{createForm.formState.isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
						</Button>
					</div>
				</form>
			</UnifiedModal>
			<UnifiedModal open={!!viewItem} onOpenChange={(o)=>!o && setViewItem(null)} title="Detalles del Cliente" size="lg">
				{viewItem && (
					<div className="space-y-6">
						{/* Header with company name */}
						<div className="text-center pb-4 border-b">
							<h3 className="text-xl font-semibold text-[var(--text-primary)]">
								{viewItem.companyName || viewItem.displayName}
							</h3>
							{viewItem.companyName && viewItem.displayName && (
								<p className="text-sm text-[var(--text-secondary)] mt-1">
									{viewItem.displayName}
								</p>
							)}
						</div>

						{/* Company Information */}
						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-4">
								<h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
									<Users className="h-4 w-4" />
									Información de la Empresa
								</h4>
								<div className="space-y-3">
									{viewItem.taxId && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">CUIT/CUIL:</span>
											<p className="text-[var(--text-primary)]">{viewItem.taxId}</p>
										</div>
									)}
									{viewItem.activityType && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Tipo de Actividad:</span>
											<p className="text-[var(--text-primary)]">{viewItem.activityType}</p>
										</div>
									)}
									{viewItem.customerType && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Tipo de Cliente:</span>
											<p className="text-[var(--text-primary)]">{viewItem.customerType}</p>
										</div>
									)}
								</div>
							</div>

							<div className="space-y-4">
								<h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
									<Users className="h-4 w-4" />
									Contacto
								</h4>
								<div className="space-y-3">
									{viewItem.contactPerson && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Persona de Contacto:</span>
											<p className="text-[var(--text-primary)]">{viewItem.contactPerson}</p>
										</div>
									)}
									{viewItem.phone && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Teléfono:</span>
											<p className="text-[var(--text-primary)]">{viewItem.phone}</p>
										</div>
									)}
									{viewItem.email && (
										<div>
											<span className="text-sm font-medium text-[var(--text-secondary)]">Email:</span>
											<p className="text-[var(--text-primary)]">{viewItem.email}</p>
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
									Dirección
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

						{/* Metadata */}
						<div className="pt-4 border-t">
							<div className="grid grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
								<div>
									<span className="font-medium">Creado:</span>
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
			</UnifiedModal>
			<UnifiedModal open={!!editItem} onOpenChange={(o)=>!o && setEditItem(null)} title="Editar Cliente" className="max-w-2xl">
				{editItem && (
					<form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
						{/* Company Name and Display Name */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Nombre de Empresa *</Label>
								<Input 
									{...editForm.register("companyName")}
									onChange={(e) => handleAddressInput(e, editForm, "companyName")}
									placeholder="Ej: Constructora ABC S.A."
									maxLength={150}
								/>
								<ErrorMessage error={editForm.formState.errors.companyName?.message} />
							</div>
							<div>
								<Label>Nombre para Mostrar</Label>
								<Input 
									{...editForm.register("displayName")}
									onChange={(e) => handleNameInput(e, editForm, "displayName")}
									placeholder="Ej: Constructora ABC"
									maxLength={100}
								/>
								<ErrorMessage error={editForm.formState.errors.displayName?.message} />
							</div>
						</div>
						
						{/* Contact Information */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Persona de Contacto</Label>
								<Input 
									{...editForm.register("contactPerson")}
									onChange={(e) => handleNameInput(e, editForm, "contactPerson")}
									placeholder="Ej: Juan Pérez"
									maxLength={100}
								/>
								<ErrorMessage error={editForm.formState.errors.contactPerson?.message} />
							</div>
							<div>
								<Label>CUIT/CUIL</Label>
								<Input 
									{...editForm.register("taxId")}
									onChange={(e) => handleCuitInput(e, editForm, "taxId")}
									placeholder="XX-XXXXXXXX-X"
									maxLength={13}
								/>
								<ErrorMessage error={editForm.formState.errors.taxId?.message} />
							</div>
						</div>
						
						{/* Address Information */}
						<div>
							<Label>Dirección</Label>
							<Input 
								{...editForm.register("address")}
								onChange={(e) => handleAddressInput(e, editForm, "address")}
								placeholder="Ej: Av. Corrientes 1234, Piso 5"
								maxLength={200}
							/>
							<ErrorMessage error={editForm.formState.errors.address?.message} />
						</div>
						
						<div className="grid grid-cols-3 gap-4">
							<div>
								<Label>Ciudad</Label>
								<Input 
									{...editForm.register("city")}
									onChange={(e) => handleNameInput(e, editForm, "city")}
									placeholder="Ej: Buenos Aires"
									maxLength={80}
								/>
								<ErrorMessage error={editForm.formState.errors.city?.message} />
							</div>
							<div>
								<Label>Provincia</Label>
								<Input 
									{...editForm.register("province")}
									onChange={(e) => handleNameInput(e, editForm, "province")}
									placeholder="Ej: Buenos Aires"
									maxLength={80}
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
						
						{/* Contact Details */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Teléfono</Label>
								<Input 
									{...editForm.register("phone")}
									onChange={(e) => handlePhoneInput(e, editForm, "phone")}
									placeholder="11-2345-6789"
									maxLength={20}
								/>
								<ErrorMessage error={editForm.formState.errors.phone?.message} />
							</div>
							<div>
								<Label>Email</Label>
								<Input 
									{...editForm.register("email")}
									onChange={(e) => handleEmailInput(e, editForm, "email")}
									placeholder="contacto@empresa.com"
									maxLength={100}
								/>
								<ErrorMessage error={editForm.formState.errors.email?.message} />
							</div>
						</div>
						
						{/* Business Information */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Tipo de Actividad</Label>
								<Input 
									{...editForm.register("activityType")}
									onChange={(e) => handleNameInput(e, editForm, "activityType")}
									placeholder="Ej: Construcción"
									maxLength={100}
								/>
								<ErrorMessage error={editForm.formState.errors.activityType?.message} />
							</div>
							<div>
								<Label>Tipo de Cliente</Label>
								<Input 
									{...editForm.register("customerType")}
									onChange={(e) => handleNameInput(e, editForm, "customerType")}
									placeholder="Ej: Empresarial"
									maxLength={100}
								/>
								<ErrorMessage error={editForm.formState.errors.customerType?.message} />
							</div>
						</div>
						
						<div className="flex gap-3 pt-4 border-t">
							<Button type="button" variant="outline" onClick={() => setEditItem(null)} className="flex-1">
								Cancelar
							</Button>
							<Button type="submit" className="flex-1" disabled={editForm.formState.isSubmitting}>
								{editForm.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
							</Button>
						</div>
					</form>
				)}
			</UnifiedModal>
			<UnifiedModal open={!!deleteItem} onOpenChange={(o)=>!o && setDeleteItem(null)} title="Eliminar Cliente">
				<p className="text-sm">¿Confirmas eliminar el cliente <b>{deleteItem?.displayName ?? deleteItem?.companyName}</b>?</p>
				<div className="mt-4 flex items-center gap-2">
					<Button variant="outline" onClick={()=>setDeleteItem(null)}>Cancelar</Button>
					<Button onClick={onConfirmDelete}>Eliminar</Button>
				</div>
			</UnifiedModal>
			
			{/* Permission Error Modal */}
			<PermissionErrorModal />
		</PageTransition>
	);
}