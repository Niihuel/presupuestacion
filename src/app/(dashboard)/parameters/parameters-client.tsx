"use client";

import useSWR from "swr";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as React from "react";
import { 
	Loader2, Calculator, Search, Plus, TrendingUp, Eye, Edit, 
	BarChart3, Filter, Hammer, Users, Building2, Fuel, 
	Truck, Zap, Settings, Target, PieChart, Activity,
	Database 
} from "lucide-react";
import { motion } from "framer-motion";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";
import { cn } from "@/lib/utils";
import { ParameterHistoryModal } from "@/components/parameters/parameter-history-modal";
import { PageTransition, SectionTransition } from "@/components/ui/page-transition";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

// Helper function to categorize parameters
function getParameterCategory(name: string): string {
	const type = name.toLowerCase();
	if (type.includes('acero') || type.includes('hierro') || type.includes('metal')) return 'Acero';
	if (type.includes('mano') || type.includes('trabajo') || type.includes('operario')) return 'Mano de Obra';
	if (type.includes('hormig') || type.includes('concreto') || type.includes('cemento')) return 'Hormigón';
	if (type.includes('combustible') || type.includes('gasolina') || type.includes('diesel')) return 'Combustible';
	if (type.includes('transporte') || type.includes('flete') || type.includes('envío')) return 'Transporte';
	return 'Otros';
}

// Helper function to get category icon
function getParameterIcon(name: string) {
	const category = getParameterCategory(name);
	switch (category) {
		case 'Acero': return Hammer;
		case 'Mano de Obra': return Users;
		case 'Hormigón': return Building2;
		case 'Combustible': return Fuel;
		case 'Transporte': return Truck;
		default: return Settings;
	}
}

// Helper function to get category color
function getCategoryColor(category: string): string {
	switch (category) {
		case 'Acero': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
		case 'Mano de Obra': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
		case 'Hormigón': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
		case 'Combustible': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
		case 'Transporte': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
		default: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
	}
}

export default function ParametersClient() {
	const [tab, setTab] = React.useState<"parametros" | "analytics">("parametros");
	const [q, setQ] = React.useState("");
	const [filterCategory, setFilterCategory] = React.useState("");
	const [sortBy, setSortBy] = React.useState<"date" | "value" | "type">("date");
	const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
	const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
	const [openNew, setOpenNew] = React.useState(false);
	const [openBulk, setOpenBulk] = React.useState(false);
	const [openHistory, setOpenHistory] = React.useState(false);
	const [selectedParameterId, setSelectedParameterId] = React.useState("");
	const [selectedParameterType, setSelectedParameterType] = React.useState("");
	
	// Data fetching with error handling
	const { data: params, mutate, error: paramsError } = useSWR(`/api/parameters`, fetcher);
	const { data: materials, error: materialsError } = useSWR(`/api/materials`, fetcher);
	
	// Permission error handling
	const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
	
	// Handle errors
	React.useEffect(() => {
		if (paramsError) {
			handlePermissionError(paramsError, "Ver parámetros");
		}
	}, [paramsError, handlePermissionError]);
	
	React.useEffect(() => {
		if (materialsError) {
			handlePermissionError(materialsError, "Ver materiales");
		}
	}, [materialsError, handlePermissionError]);
	
	// Filter and sort parameters
	const filteredAndSortedParams = React.useMemo(() => {
		if (!params) return [];
		
		let filtered = params.filter((param: any) => {
			const matchesSearch = param.name.toLowerCase().includes(q.toLowerCase());
			const matchesCategory = !filterCategory || getParameterCategory(param.name) === filterCategory;
			return matchesSearch && matchesCategory;
		});
		
		// Sort
		filtered.sort((a: any, b: any) => {
			let result = 0;
			switch (sortBy) {
				case "date":
					result = new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime();
					break;
				case "value":
					result = a.value - b.value;
					break;
				case "type":
					result = a.name.localeCompare(b.name);
					break;
			}
			return sortOrder === "asc" ? result : -result;
		});
		
		return filtered;
	}, [params, q, filterCategory, sortBy, sortOrder]);
	
	// Get unique categories
	const categories = React.useMemo(() => {
		if (!params) return [];
		const cats = params.map((p: any) => getParameterCategory(p.name));
		return Array.from(new Set(cats)).sort() as string[];
	}, [params]);
	
	// Calculate analytics
	const analytics = React.useMemo(() => {
		if (!filteredAndSortedParams.length) return { total: 0, avgValue: 0, maxValue: 0, minValue: 0 };
		
		const values = filteredAndSortedParams.map((p: any) => p.value);
		return {
			total: filteredAndSortedParams.length,
			avgValue: values.reduce((a: number, b: number) => a + b, 0) / values.length,
			maxValue: Math.max(...values),
			minValue: Math.min(...values)
		};
	}, [filteredAndSortedParams]);
	
	// Create new parameter
	async function onAddParam(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget as HTMLFormElement);
		const payload = {
			name: fd.get("parameterType") as string,
			value: parseFloat(fd.get("value") as string),
			unit: fd.get("unit") as string,
			effectiveDate: fd.get("effectiveDate") as string
		};
		
		try {
			await axios.post(`/api/parameters`, payload);
			toast.success("Parámetro creado correctamente");
			(e.currentTarget as HTMLFormElement).reset();
			mutate();
			setOpenNew(false);
		} catch (error) {
			handlePermissionError(error, "Crear parámetro");
		}
	}
	
	// Bulk price increase
	async function onBulkIncrease(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget as HTMLFormElement);
		const percent = parseFloat(fd.get("percent") as string);
		
		try {
			await axios.post(`/api/parameters/bulk-increase`, { percent });
			toast.success(`Precios aumentados ${percent}% correctamente`);
			mutate();
			setOpenBulk(false);
			(e.currentTarget as HTMLFormElement).reset();
		} catch (error) {
			handlePermissionError(error, "Aumento masivo de precios");
		}
	}
	
	const historyDisplay = materials?.items ? materials.items.slice(0, 10) : [];
	
	if (!params && !paramsError) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="flex items-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin" />
					<span>Cargando parámetros...</span>
				</div>
			</div>
		);
	}
	
	return (
		<PageTransition>
			{/* Header */}
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-[var(--text-primary)]">Parámetros</h1>
					<p className="text-[var(--text-secondary)] mt-1">
						Gestiona los parámetros de costos del sistema
					</p>
				</div>
			</div>
			
			{/* Tabs */}
			<div className="flex gap-1 bg-[var(--surface-secondary)] p-1 rounded-lg w-fit">
				<Button
					variant={tab === "parametros" ? "default" : "ghost"}
					size="sm"
					onClick={() => setTab("parametros")}
					className="gap-2"
				>
					<Settings className="h-4 w-4" />
					Parámetros
				</Button>
				<Button
					variant={tab === "analytics" ? "default" : "ghost"}
					size="sm"
					onClick={() => setTab("analytics")}
					className="gap-2"
				>
					<PieChart className="h-4 w-4" />
					Analíticas
				</Button>
			</div>

			{/* Analytics Tab */}
			{tab === 'analytics' && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
				>
					<Card className="glass-card">
						<CardContent className="p-6">
							<div className="flex items-center gap-3">
								<div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
									<Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<p className="text-sm text-[var(--text-secondary)]">Total Parámetros</p>
									<p className="text-2xl font-bold text-[var(--text-primary)]">{analytics.total}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					
					<Card className="glass-card">
						<CardContent className="p-6">
							<div className="flex items-center gap-3">
								<div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
									<BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<p className="text-sm text-[var(--text-secondary)]">Promedio</p>
									<p className="text-2xl font-bold text-[var(--text-primary)]">
										{analytics.avgValue.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					
					<Card className="glass-card">
						<CardContent className="p-6">
							<div className="flex items-center gap-3">
								<div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
									<TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
								</div>
								<div>
									<p className="text-sm text-[var(--text-secondary)]">Máximo</p>
									<p className="text-2xl font-bold text-[var(--text-primary)]">
										{analytics.maxValue.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					
					<Card className="glass-card">
						<CardContent className="p-6">
							<div className="flex items-center gap-3">
								<div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
									<Calculator className="h-6 w-6 text-orange-600 dark:text-orange-400" />
								</div>
								<div>
									<p className="text-sm text-[var(--text-secondary)]">Mínimo</p>
									<p className="text-2xl font-bold text-[var(--text-primary)]">
										{analytics.minValue.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			)}

			{/* Parameters Tab */}
			{tab === 'parametros' && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="space-y-6"
				>
					{/* Controls */}
					<Card className="glass-card">
						<CardContent className="p-6">
							<div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
								<div className="flex flex-wrap gap-3 items-center">
									{/* Search */}
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
										<Input 
											value={q} 
											onChange={e => setQ(e.target.value)} 
											placeholder="Buscar parámetro..." 
											className="pl-9 w-64"
										/>
									</div>
									
									{/* Category filter */}
									<select
										value={filterCategory}
										onChange={e => setFilterCategory(e.target.value)}
										className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-primary)] text-sm"
									>
										<option value="">Todas las categorías</option>
										{categories.map((cat: string) => (
											<option key={cat} value={cat}>{cat}</option>
										))}
									</select>
									
									{/* Sort options */}
									<select
										value={`${sortBy}-${sortOrder}`}
										onChange={e => {
											const [by, order] = e.target.value.split('-');
											setSortBy(by as any);
											setSortOrder(order as any);
										}}
										className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-primary)] text-sm"
									>
										<option value="date-desc">Fecha (más reciente)</option>
										<option value="date-asc">Fecha (más antigua)</option>
										<option value="value-desc">Valor (mayor)</option>
										<option value="value-asc">Valor (menor)</option>
										<option value="type-asc">Tipo (A-Z)</option>
										<option value="type-desc">Tipo (Z-A)</option>
									</select>
									
									{/* View mode toggle */}
									<div className="flex bg-[var(--surface-secondary)] rounded-lg p-1">
										<Button
											variant={viewMode === "grid" ? "default" : "ghost"}
											size="sm"
											onClick={() => setViewMode("grid")}
											className="h-8"
										>
											<BarChart3 className="h-3 w-3" />
										</Button>
										<Button
											variant={viewMode === "list" ? "default" : "ghost"}
											size="sm"
											onClick={() => setViewMode("list")}
											className="h-8"
										>
											<Filter className="h-3 w-3" />
										</Button>
									</div>
								</div>
								
								{/* Actions */}
								<div className="flex gap-3">
									<Button variant="outline" onClick={() => setOpenBulk(true)}>
										<TrendingUp className="h-4 w-4 mr-2" />
										Aumento masivo
									</Button>
									<Button onClick={() => setOpenNew(true)} className="btn-primary">
										<Plus className="h-4 w-4 mr-2" />
										Nuevo Parámetro
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Parameters Display */}
					{viewMode === "grid" ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{filteredAndSortedParams.map((param: any, index: number) => {
								const category = getParameterCategory(param.name);
								const IconComponent = getParameterIcon(param.name);
								
								return (
									<motion.div
										key={param.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
										whileHover={{ y: -4 }}
										className="group"
									>
										<Card className="glass-card h-full hover:shadow-lg hover:border-[var(--accent-primary)]/20 transition-all duration-200 cursor-pointer">
											<CardContent className="p-6">
												<div className="flex items-start justify-between mb-4">
													<div className="p-3 rounded-xl bg-[var(--surface-secondary)] group-hover:bg-[var(--accent-primary)]/10 transition-colors">
														<IconComponent className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]" />
													</div>
													<Badge className={cn("text-xs", getCategoryColor(category))}>
														{category}
													</Badge>
												</div>
												
												<div className="space-y-3">
													<div>
														<h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
															{param.name}
														</h3>
														<p className="text-sm text-[var(--text-secondary)] mt-1">
															{new Date(param.effectiveDate).toLocaleDateString('es-ES', {
																year: 'numeric',
																month: 'short',
																day: 'numeric'
															})}
														</p>
													</div>
													
													<div className="flex items-end justify-between">
														<div>
															<p className="text-2xl font-bold text-[var(--text-primary)]">
																{param.value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
															</p>
															<p className="text-xs text-[var(--text-secondary)]">
																{param.unit || 'unidad'}
															</p>
														</div>
														
														<div className="flex gap-1">
															<Button 
																variant="ghost" 
																size="sm" 
																className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
																onClick={() => {
																	setSelectedParameterId(param.id);
																	setSelectedParameterType(param.name);
																	setOpenHistory(true);
																}}
															>
																<Eye className="h-3 w-3" />
															</Button>
															<Button 
																variant="ghost" 
																size="sm" 
																className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
															>
																<Edit className="h-3 w-3" />
															</Button>
														</div>
													</div>
												</div>
											</CardContent>
										</Card>
									</motion.div>
								);
							})}
						</div>
					) : (
						<Card className="glass-card">
							<CardContent className="p-0">
								<div className="space-y-1">
									{filteredAndSortedParams.map((param: any, index: number) => {
										const category = getParameterCategory(param.name);
										const IconComponent = getParameterIcon(param.name);
										
										return (
											<motion.div
												key={param.id}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: index * 0.02 }}
												className="flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] transition-colors border-b last:border-b-0 border-[var(--surface-border)]"
											>
												<div className="flex items-center gap-4 flex-1">
													<div className="p-2 rounded-lg bg-[var(--surface-secondary)]">
														<IconComponent className="h-4 w-4 text-[var(--text-secondary)]" />
													</div>
													
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-1">
															<h3 className="font-medium text-[var(--text-primary)] truncate">
																{param.name}
															</h3>
															<Badge className={cn("text-xs", getCategoryColor(category))}>
																{category}
															</Badge>
														</div>
														<p className="text-sm text-[var(--text-secondary)]">
															{new Date(param.effectiveDate).toLocaleDateString('es-ES', {
																year: 'numeric',
																month: 'short',
																day: 'numeric'
															})}
														</p>
													</div>
												</div>
												
												<div className="flex items-center gap-4">
													<div className="text-right">
														<p className="text-lg font-bold text-[var(--text-primary)]">
															{param.value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
														</p>
														<p className="text-xs text-[var(--text-secondary)]">
															{param.unit || 'unidad'}
														</p>
													</div>
													
													<div className="flex gap-1">
														<Button 
															variant="ghost" 
															size="sm" 
															className="h-8 w-8 p-0"
															onClick={() => {
																setSelectedParameterId(param.id);
																setSelectedParameterType(param.name);
																setOpenHistory(true);
															}}
														>
															<Eye className="h-3 w-3" />
														</Button>
														<Button 
															variant="ghost" 
															size="sm" 
															className="h-8 w-8 p-0"
														>
															<Edit className="h-3 w-3" />
														</Button>
													</div>
												</div>
											</motion.div>
										);
									})}
								</div>
								
								{filteredAndSortedParams.length === 0 && (
									<div className="text-center py-12">
										<Calculator className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
										<h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
											No se encontraron parámetros
										</h3>
										<p className="text-[var(--text-secondary)]">
											Ajusta los filtros o agrega nuevos parámetros
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</motion.div>
			)}

			{/* Modals */}
			<UnifiedModal open={openNew} onOpenChange={setOpenNew} title="Nuevo Parámetro">
				<form onSubmit={onAddParam} className="space-y-4">
					<div>
						<Label>Nombre del Parámetro</Label>
						<Input name="parameterType" required placeholder="Ej: Acero H25, Mano de obra especializada" />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>Valor</Label>
							<Input name="value" type="number" step="0.01" required placeholder="0.00" />
						</div>
						<div>
							<Label>Unidad</Label>
							<Input name="unit" placeholder="$/kg, $/m³, etc." />
						</div>
					</div>
					<div>
						<Label>Fecha Efectiva</Label>
						<Input name="effectiveDate" type="date" required />
					</div>
					<div className="flex gap-3 pt-4">
						<Button type="button" variant="outline" onClick={() => setOpenNew(false)}>
							Cancelar
						</Button>
						<Button type="submit" className="btn-primary">
							<Plus className="h-4 w-4 mr-2" />
							Agregar Parámetro
						</Button>
					</div>
				</form>
			</UnifiedModal>

			<UnifiedModal open={openBulk} onOpenChange={setOpenBulk} title="Aumento Masivo de Precios">
				<form onSubmit={onBulkIncrease} className="space-y-4">
					<div>
						<Label>Porcentaje de Aumento</Label>
						<div className="relative">
							<Input 
								name="percent" 
								type="number" 
								step="0.01" 
								required 
								placeholder="5.50"
								className="pr-8"
							/>
							<span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]">%</span>
						</div>
						<p className="text-sm text-[var(--text-secondary)] mt-1">
							Este porcentaje se aplicará a todos los parámetros existentes
						</p>
					</div>
					<div className="flex gap-3 pt-4">
						<Button type="button" variant="outline" onClick={() => setOpenBulk(false)}>
							Cancelar
						</Button>
						<Button type="submit" className="btn-primary">
							<TrendingUp className="h-4 w-4 mr-2" />
							Aplicar Aumento
						</Button>
					</div>
				</form>
			</UnifiedModal>
			
			<ParameterHistoryModal 
				open={openHistory}
				onOpenChange={setOpenHistory}
				parameterId={selectedParameterId}
				name={selectedParameterType}
			/>
			
			{/* Permission Error Modal */}
			<PermissionErrorModal />
		</PageTransition>
	);
}