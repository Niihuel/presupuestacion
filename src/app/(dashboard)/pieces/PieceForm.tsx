"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { pieceSchema } from "@/lib/validations/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import useSWR from "swr";
import { calculateMaterials, validateProductionRestrictions, calculateVaporEnergyCost } from "@/lib/validations/materials";
import { toast } from "sonner";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

type PieceFormValues = z.input<typeof pieceSchema>;

interface PieceFormProps {
	piece?: any;
	onSave: (data: any) => void;
	onCancel: () => void;
}

export function PieceForm({ piece, onSave, onCancel }: PieceFormProps) {
	const [selectedFamily, setSelectedFamily] = useState<string>(piece?.familyId || "");
	const [costPreview, setCostPreview] = useState<any>(null);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [step, setStep] = useState(1);
	const [isCheckingStep, setIsCheckingStep] = useState(false);
	const isCheckingStepRef = useRef(false);
	
	const { data: families } = useSWR("/api/piece-families", fetcher);
	const { data: plants } = useSWR("/api/plants", fetcher);
	const { data: molds } = useSWR(
		selectedFamily ? `/api/molds?familyId=${selectedFamily}` : null,
		fetcher
	);
	const { data: materials } = useSWR("/api/materials", fetcher);
	
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		setError,
		setFocus,
		reset,
		control,
		trigger,
		formState: { errors, isSubmitting }
	} = useForm<PieceFormValues>({
		resolver: zodResolver(pieceSchema),
		defaultValues: (piece as Partial<PieceFormValues>) || { materials: [] }
	});
	
	const watchedValues = watch();
	const watchedMaterials = watch("materials") || [];

	// FieldArray para materiales BOM
	const { fields: materialFields, append: appendMaterial, remove: removeMaterial, replace: replaceMaterials } = useFieldArray({
		control,
		name: "materials"
	});

	// Sincronizar formulario y paso cuando cambia la pieza (abrir/editar)
	useEffect(() => {
		setStep(1);
		setSelectedFamily(piece?.familyId || "");
		if (piece) {
			const mappedMaterials = (piece as any)?.materials?.map((m: any) => ({
				materialId: m.materialId,
				quantity: m.quantity,
				scrap: typeof m.scrap !== "undefined" ? m.scrap : (m.scrapPercent ?? 0),
			})) ?? [];
			reset({ ...(piece as any), materials: mappedMaterials } as any);
			setValue("familyId" as any, piece.familyId || "");
		} else {
			reset({ materials: [] } as any);
			setValue("familyId" as any, "");
		}
	}, [piece, reset, setValue]);
	
	// Obtener configuración de la familia seleccionada
	const familyConfig = families?.items?.find((f: any) => f.id === selectedFamily);
	
	// Campos dinámicos según familia
	const getDynamicFields = () => {
		if (!familyConfig) return [];
		
		const fields = [];
		
		if (familyConfig.requiresMold) {
			fields.push({
				name: "moldId",
				label: "Molde",
				type: "select",
				options: molds?.items || [],
				required: true,
				tooltip: "Molde específico para esta pieza"
			});
		}
		
		if (familyConfig.requiresCables) {
			fields.push({
				name: "cableCount",
				label: "Cantidad de Cables",
				type: "number",
				min: 0,
				max: familyConfig.maxCables || 100,
				tooltip: `Máximo ${familyConfig.maxCables || 100} cables permitidos`
			});
			
			fields.push({
				name: "trackLength",
				label: "Longitud de Pista (m)",
				type: "select",
				options: [
					{ value: 50, label: "50m" },
					{ value: 102, label: "102m" }
				],
				tooltip: "Longitud de pista para pretensado"
			});
		}
		
		// Campos específicos por familia
		if (familyConfig.code === "ENTREPISOS") {
			fields.push(
				{
					name: "meshLayers",
					label: "Capas de Malla",
					type: "select",
					options: [
						{ value: 0, label: "Sin malla" },
						{ value: 1, label: "1 capa" },
						{ value: 2, label: "2 capas" }
					]
				},
				{
					name: "hasAntiseismic",
					label: "Antisísmico",
					type: "checkbox",
					tooltip: "Refuerzo antisísmico adicional"
				}
			);
		}
		
		if (familyConfig.code === "PANELES_W") {
			fields.push(
				{
					name: "hasInsulation",
					label: "Aislación",
					type: "checkbox",
					tooltip: "Incluye aislación térmica"
				},
				{
					name: "hasTelgopor",
					label: "Telgopor",
					type: "checkbox",
					tooltip: "Incluye telgopor en el núcleo"
				}
			);
		}
		
		if (familyConfig.code === "ANTIRUIDO") {
			fields.push({
				name: "concreteSettlement",
				label: "Asentamiento Hormigón (cm)",
				type: "number",
				min: 0,
				max: 20,
				tooltip: "Asentamiento del hormigón especial"
			});
		}
		
		return fields;
	};
	
	// Calcular costos automáticamente
	useEffect(() => {
		if (!watchedValues.volume || !selectedFamily || !materials?.items) return;
		
		const materialCalcs = calculateMaterials(
			familyConfig?.code,
			watchedValues.volume,
			(watchedValues.width ?? 0) * (watchedValues.length ?? 0),
			watchedValues.cableCount ?? 0,
			watchedValues.trackLength
		);
		
		let totalCost = 0;
		const breakdown = materialCalcs.map(calc => {
			const material = materials.items.find((m: any) => 
				m.code === calc.materialId || m.name.toLowerCase().includes(calc.materialId)
			);
			
			if (material) {
				const cost = calc.quantity * material.currentPrice;
				totalCost += cost;
				return {
					material: material.name,
					quantity: calc.quantity,
					unit: calc.unit,
					unitPrice: material.currentPrice,
					total: cost,
					formula: calc.formula
				};
			}
			return null;
		}).filter(Boolean);
		
		// Agregar costo de energía si hay ciclo de vapor
		if (familyConfig?.requiresVaporCycle && watchedValues.weight) {
			const energyCost = calculateVaporEnergyCost(
				familyConfig.code,
				watchedValues.weight / 1000, // convertir kg a toneladas
				0.15 // $0.15 por kWh (ejemplo)
			);
			breakdown.push({
				material: "Energía (Ciclo Vapor)",
				quantity: watchedValues.weight * 17.5 / 1000,
				unit: "kWh",
				unitPrice: 0.15,
				total: energyCost,
				formula: "17.5 kWh/ton × peso"
			});
			totalCost += energyCost;
		}
		
		setCostPreview({
			totalCost,
			breakdown,
			margin: totalCost * 0.25, // 25% margen ejemplo
			finalPrice: totalCost * 1.25
		});
	}, [watchedValues, selectedFamily, materials, familyConfig]);
	
	// Validar restricciones de producción
	useEffect(() => {
		if (!watchedValues.plantId || !selectedFamily) return;
		
		const plant = plants?.items?.find((p: any) => p.id === watchedValues.plantId);
		if (!plant) return;
		
		const validation = validateProductionRestrictions(
			plant.name,
			familyConfig?.code,
			watchedValues.moldId,
			watchedValues.trackLength
		);
		
		setValidationErrors(validation.errors);
	}, [watchedValues.plantId, selectedFamily, watchedValues.moldId, watchedValues.trackLength, plants, familyConfig]);

	const onSubmit = async (data: any) => {
		console.debug("[PieceForm] Submitting piece data:", data);
		try {
			await onSave(data);
			console.debug("[PieceForm] Submit finished");
		} catch (error) {
			console.error("Error saving piece:", error);
		}
	};

	// Navegación con validación por paso
	const handleNext = async () => {
		// Helper: timeout guard to avoid indefinite hanging validations
		const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
			let timer: any;
			const timeout = new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error(`[PieceForm] ${label} validation timeout after ${ms}ms`)), ms);
			});
			try {
				const result = await Promise.race([promise, timeout]);
				return result as T;
			} finally {
				clearTimeout(timer);
			}
		};

		// Re-entrancy guard to avoid multiple validations running at once
		if (isCheckingStepRef.current) {
			console.debug("[PieceForm] handleNext blocked: already checking step");
			return;
		}
		isCheckingStepRef.current = true;
		setIsCheckingStep(true);
		try {
			if (step === 1) {
				console.debug("[PieceForm] Step 1 validate start");
				const valid = await withTimeout(trigger(["familyId", "description"], { shouldFocus: true }), 6000, "Step 1");
				console.debug("[PieceForm] Step 1 validate result:", valid);
				if (!valid) return;
			}
			if (step === 2) {
				console.debug("[PieceForm] Step 2 validate start");
				let ok = true;
				if (familyConfig?.requiresMold && !watchedValues.moldId) {
					setError("moldId" as any, { type: "required", message: "Seleccione un molde" } as any);
					// Ensure focus goes to mold selector for faster correction
					try { setFocus("moldId" as any); } catch {}
					ok = false;
				}
				const materialsValid = await withTimeout(trigger("materials", { shouldFocus: true }), 6000, "Step 2 (materials)");
				ok = ok && materialsValid;
				console.debug("[PieceForm] Step 2 validate result:", ok, "materialsValid:", materialsValid);
				if (!ok) return;
			}
			setStep((prev) => prev + 1);
		} catch (e) {
			console.error("[PieceForm] handleNext error:", e);
			toast.error((e as Error)?.message || "Error durante la validación del paso");
		} finally {
			isCheckingStepRef.current = false;
			setIsCheckingStep(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Hidden registered fields to ensure validation triggers */}
			<input type="hidden" {...register("familyId" as any)} />
			<input type="hidden" {...register("plantId" as any)} />
			<input type="hidden" {...register("moldId" as any)} />
			{/* Indicador de pasos */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center space-x-2">
					{[1, 2, 3].map(s => (
						<div key={s} className="flex items-center">
							<div className={`
								w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
								${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
							`}>
								{s}
							</div>
							{s < 3 && (
								<div className={`w-16 h-0.5 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />
							)}
						</div>
					))}
				</div>
				<div className="text-sm text-muted-foreground">
					Paso {step} de 3: {
						step === 1 ? "Información Básica" :
						step === 2 ? "Configuración Específica" :
						"Costos y Validación"
					}
				</div>
			</div>
			
			{/* Paso 1: Información Básica */}
			{step === 1 && (
				<Card className="p-6">
					<h3 className="text-lg font-semibold mb-4">Información Básica</h3>
					
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								Familia de Pieza <span className="text-destructive">*</span>
							</label>
							<Select
								value={selectedFamily}
								onChange={(e) => {
									setSelectedFamily(e.target.value);
									setValue("familyId", e.target.value);
								}}
								className="w-full"
							>
								<option value="">Seleccionar familia...</option>
								{families?.items?.map((family: any) => (
									<option key={family.id} value={family.id}>{family.code || family.description}</option>
								))}
							</Select>
							{(errors as any)?.familyId && (
								<p className="text-sm text-destructive mt-1">{((errors as any)?.familyId?.message as string) || ""}</p>
							)}
						</div>
						{/* Planta */}
						<div>
							<label className="block text-sm font-medium mb-1">Planta</label>
							<Select
								value={(watchedValues as any)?.plantId ?? ""}
								onChange={(e) => setValue("plantId" as any, e.target.value)}
								className="w-full"
							>
								<option value="">Seleccionar planta...</option>
								{plants?.items?.map((p: any) => (
									<option key={p.id} value={p.id}>{p.name || p.code || p.description}</option>
								))}
							</Select>
						</div>

						{/* Descripción */}
						<div className="col-span-2">
							<label className="block text-sm font-medium mb-1">Descripción <span className="text-destructive">*</span></label>
							<Input type="text" placeholder="Descripción de la pieza" {...register("description")} />
							{(errors as any)?.description && (
								<p className="text-sm text-destructive mt-1">{((errors as any)?.description?.message as string) || ""}</p>
							)}
						</div>

						{/* Dimensiones y datos */}
						<div>
							<label className="block text-sm font-medium mb-1">Peso (kg)</label>
							<Input type="number" step="0.01" placeholder="0.00" {...register("weight", { valueAsNumber: true })} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Volumen (m³)</label>
							<Input type="number" step="0.0001" placeholder="0.0000" {...register("volume", { valueAsNumber: true })} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Ancho (m)</label>
							<Input type="number" step="0.001" placeholder="0.000" {...register("width", { valueAsNumber: true })} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Largo (m)</label>
							<Input type="number" step="0.001" placeholder="0.000" {...register("length", { valueAsNumber: true })} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Espesor (m)</label>
							<Input type="number" step="0.001" placeholder="0.000" {...register("thickness", { valueAsNumber: true })} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Altura (m)</label>
							<Input type="number" step="0.001" placeholder="0.000" {...register("height", { valueAsNumber: true })} />
						</div>
					</div>
				</Card>
			)}

			{/* Paso 2: Configuración Específica */}
			{step === 2 && (
				<Card className="p-6">
					<h3 className="text-lg font-semibold mb-4">Configuración Específica</h3>

					{/* Campos dinámicos según familia */}
					<div className="grid grid-cols-2 gap-4 mb-6">
						{getDynamicFields().map((field: any) => (
							<div key={field.name}>
								<label className="block text-sm font-medium mb-1">{field.label}</label>
								{field.type === "select" ? (
									<Select
										value={(watchedValues as any)[field.name] ?? ""}
										onChange={(e) => setValue(field.name as any, (
											Array.isArray(field.options) && field.options.length > 0 && typeof field.options[0] === "object" && ("id" in field.options[0])
										) ? e.target.value : (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)))}
										className="w-full"
									>
										<option value="">{`Seleccionar ${field.label.toLowerCase()}...`}</option>
										{(field.options || []).map((opt: any) => (
											<option key={opt.id ?? opt.value ?? opt} value={opt.id ?? opt.value ?? opt}>
												{opt.code ?? opt.label ?? opt.name ?? String(opt)}
											</option>
										))}
									</Select>
								) : field.type === "checkbox" ? (
									<label className="flex items-center space-x-2">
										<input
											type="checkbox"
											checked={Boolean((watchedValues as any)[field.name])}
											onChange={(e) => setValue(field.name as any, e.target.checked)}
											className="w-4 h-4"
										/>
										<span className="text-sm">{field.label}</span>
									</label>
								) : (
									<Input type="number" placeholder="0" {...register(field.name as any, { valueAsNumber: true, min: field.min, max: field.max })} />
								)}
								{(errors as any)?.[field.name] && (
									<p className="text-xs text-destructive mt-1">{(((errors as any)?.[field.name]?.message as string) || "")}</p>
								)}
							</div>
						))}
					</div>

					{/* Materiales (BOM) */}
					<div className="mb-4 flex items-center justify-between">
						<h4 className="text-sm font-medium flex items-center gap-2"><DollarSign className="w-4 h-4" /> Materiales</h4>
						<Button type="button" onClick={() => appendMaterial({ materialId: "", quantity: 0, scrap: 0 })}>
							<Plus className="w-4 h-4 mr-1" /> Agregar material
						</Button>
					</div>
					<div className="border rounded-lg overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left">
									<th className="p-2">Material</th>
									<th className="p-2">Cantidad</th>
									<th className="p-2">% Merma</th>
									<th className="p-2">Acciones</th>
								</tr>
							</thead>
							<tbody>
								{materialFields.map((field, i) => (
									<tr key={field.id} className="border-t">
										<td className="p-2">
											<Select
												value={watchedMaterials?.[i]?.materialId ?? ""}
												onChange={(e) => setValue(`materials.${i}.materialId` as const, e.target.value)}
												className="w-full"
											>
												<option value="">Seleccionar material...</option>
												{materials?.items?.map((m: any) => (
													<option key={m.id} value={m.id}>{m.name ?? m.code}</option>
												))}
											</Select>
											{((errors as any)?.materials)?.[i]?.materialId && (
												<p className="text-xs text-destructive mt-1">{((((errors as any)?.materials)?.[i]?.materialId?.message as string) || "")}</p>
											)}
										</td>
										<td className="p-2">
											<Input type="number" step="0.0001" placeholder="0.0000" {...register(`materials.${i}.quantity` as const, { valueAsNumber: true })} />
											{((errors as any)?.materials)?.[i]?.quantity && (
												<p className="text-xs text-destructive mt-1">{((((errors as any)?.materials)?.[i]?.quantity?.message as string) || "")}</p>
											)}
										</td>
										<td className="p-2">
											<Input type="number" step="0.01" placeholder="0" {...register(`materials.${i}.scrap` as const, { valueAsNumber: true })} />
											{((errors as any)?.materials)?.[i]?.scrap && (
												<p className="text-xs text-destructive mt-1">{((((errors as any)?.materials)?.[i]?.scrap?.message as string) || "")}</p>
											)}
										</td>
										<td className="p-2">
											<Button type="button" variant="ghost" onClick={() => removeMaterial(i)}>
												<Trash2 className="w-4 h-4" />
											</Button>
										</td>
									</tr>
								))}
								{materialFields.length === 0 && (
									<tr>
										<td className="p-2 text-muted-foreground" colSpan={4}>No hay materiales. Agregue al menos uno si corresponde.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</Card>
			)}

			{/* Paso 3: Costos y Validación */}
			{step === 3 && (
				<Card className="p-6">
					<h3 className="text-lg font-semibold mb-4">Costos y Validación</h3>
					{/* Configuración de transporte */}
					<div className="space-y-4 mb-6">
						<h4 className="text-sm font-medium">Configuración de Transporte</h4>
						
						<div className="grid grid-cols-2 gap-4">
							<label className="flex items-center space-x-2">
								<input
									type="checkbox"
									{...register("individualTransport")}
									className="w-4 h-4"
								/>
								<span className="text-sm">Transporte individual</span>
							</label>
							
							<label className="flex items-center space-x-2">
								<input
									type="checkbox"
									{...register("requiresEscort")}
									className="w-4 h-4"
								/>
								<span className="text-sm">Requiere escolta</span>
							</label>
						</div>
						
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">
									Piezas por camión
								</label>
								<Input
									type="number"
									{...register("piecesPerTruck", { valueAsNumber: true })}
									placeholder="1"
								/>
							</div>
							
							<div>
								<label className="block text-sm font-medium mb-1">
									Máximo apilable
								</label>
								<Input
									type="number"
									{...register("maxStackable", { valueAsNumber: true })}
									placeholder="1"
								/>
							</div>
						</div>
					</div>
					
					{/* Precios por planta */}
					<div className="space-y-4 mb-6">
						<h4 className="text-sm font-medium">Precios por Planta</h4>
						
						<div className="grid grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">
									Córdoba ($)
								</label>
								<Input
									type="number"
									step="0.01"
									{...register("priceCordoba", { valueAsNumber: true })}
									placeholder="0.00"
								/>
							</div>
							
							<div>
								<label className="block text-sm font-medium mb-1">
									Buenos Aires ($)
								</label>
								<Input
									type="number"
									step="0.01"
									{...register("priceBuenosAires", { valueAsNumber: true })}
									placeholder="0.00"
								/>
							</div>
							
							<div>
								<label className="block text-sm font-medium mb-1">
									Villa María ($)
								</label>
								<Input
									type="number"
									step="0.01"
									{...register("priceVillaMaria", { valueAsNumber: true })}
									placeholder="0.00"
								/>
							</div>
						</div>
					</div>
					
					{/* Preview de costos */}
					{costPreview && (
						<div className="border rounded-lg p-4 bg-muted/50">
							<div className="flex items-center justify-between mb-3">
								<h4 className="font-medium flex items-center gap-2">
									<Calculator className="w-4 h-4" />
									Cálculo de Costos
								</h4>
								<Badge variant="outline">Estimado</Badge>
							</div>
							
							<div className="space-y-2 text-sm">
								{costPreview.breakdown.map((item: any, i: number) => (
									<div key={i} className="flex justify-between py-1 border-b">
										<div>
											<span className="font-medium">{item.material}</span>
											<span className="text-muted-foreground ml-2">
												({item.quantity.toFixed(2)} {item.unit} × ${item.unitPrice})
											</span>
											{item.formula && (
												<span className="text-xs text-muted-foreground block">
													📐 {item.formula}
												</span>
											)}
										</div>
										<span>${item.total.toFixed(2)}</span>
									</div>
								))}
								
								<div className="pt-2 space-y-1">
									<div className="flex justify-between">
										<span>Costo de materiales:</span>
										<span className="font-medium">${costPreview.totalCost.toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-muted-foreground">
										<span>Margen (25%):</span>
										<span>${costPreview.margin.toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-lg font-semibold pt-2 border-t">
										<span>Precio sugerido:</span>
										<span className="text-primary">${costPreview.finalPrice.toFixed(2)}</span>
									</div>
								</div>
							</div>
						</div>
					)}
				</Card>
			)}
			
			{/* Botones de navegación */}
			<div className="flex justify-between">
				<div>
					{step > 1 && (
						<Button
							type="button"
							variant="outline"
							onClick={() => setStep(step - 1)}
						>
							Anterior
						</Button>
					)}
				</div>
				
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
					>
						Cancelar
					</Button>
					
					{step < 3 ? (
						<Button
							type="button"
							onClick={handleNext}
							disabled={(step === 1 && !selectedFamily) || isCheckingStep}
						>
							Siguiente
						</Button>
					) : (
						<Button
							type="submit"
							disabled={isSubmitting || validationErrors.length > 0}
						>
							{isSubmitting ? "Guardando..." : "Guardar Pieza"}
						</Button>
					)}
				</div>
			</div>
		</form>
	);
}
