"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pieceFamilySchema, formatters } from "@/lib/validations/pieces";
import { useEffect } from "react";
import { Settings, Package, Zap, Info, Code, FileText, Tag, Cpu } from "lucide-react";
import { z } from "zod";

type PieceFamilyFormData = z.infer<typeof pieceFamilySchema>;

interface PieceFamilyFormProps {
  family?: any;
  onSave: (data: PieceFamilyFormData) => void;
  onCancel: () => void;
}

export function PieceFamilyForm({ family, onSave, onCancel }: PieceFamilyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PieceFamilyFormData>({
    resolver: zodResolver(pieceFamilySchema),
    defaultValues: {
      code: "",
      description: "",
      category: "",
      requiresMold: false,
      requiresCables: false,
      requiresVaporCycle: false,
      maxCables: undefined,
      defaultConcreteType: ""
    }
  });

  // Reset form when family changes
  useEffect(() => {
    if (family) {
      reset({
        code: family.code || "",
        description: family.description || "",
        category: family.category || "",
        requiresMold: Boolean(family.requiresMold),
        requiresCables: Boolean(family.requiresCables),
        requiresVaporCycle: Boolean(family.requiresVaporCycle),
        maxCables: family.maxCables || undefined,
        defaultConcreteType: family.defaultConcreteType || ""
      });
    } else {
      reset({
        code: "",
        description: "",
        category: "",
        requiresMold: false,
        requiresCables: false,
        requiresVaporCycle: false,
        maxCables: undefined,
        defaultConcreteType: ""
      });
    }
  }, [family, reset]);

  const watchRequiresCables = watch("requiresCables");

  const onSubmit = (data: PieceFamilyFormData) => {
    // Clean up data before submission
    const cleanedData = {
      ...data,
      code: data.code.trim().toUpperCase(),
      description: data.description?.trim() || undefined,
      category: data.category?.trim() || undefined,
      defaultConcreteType: data.defaultConcreteType?.trim() || undefined,
      maxCables: data.maxCables || undefined
    };
    
    onSave(cleanedData);
  };

  // Input formatters
  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatters.familyCode(e.target.value);
    setValue("code", formatted);
  };

  const handleDescriptionInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const formatted = formatters.description(e.target.value);
    setValue("description", formatted);
  };

  const handleCategoryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value
      .replace(/[^a-zA-Z0-9\s\-\.]/g, '')
      .slice(0, 100);
    setValue("category", formatted);
  };

  const handleConcreteTypeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatters.concreteType(e.target.value);
    setValue("defaultConcreteType", formatted);
  };

  const handleMaxCablesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numValue = value ? parseInt(value) : undefined;
    setValue("maxCables", numValue);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code" className="flex items-center gap-1">
                <Code className="w-4 h-4" />
                Código <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="ENTREPISOS"
                {...register("code")}
                onChange={handleCodeInput}
                className="font-mono"
              />
              {errors.code && (
                <p className="text-sm text-destructive mt-1">{errors.code.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Solo letras mayúsculas, números, guiones y guiones bajos
              </p>
            </div>
            
            <div>
              <Label htmlFor="category" className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Categoría
              </Label>
              <Input
                id="category"
                placeholder="Elementos estructurales"
                {...register("category")}
                onChange={handleCategoryInput}
              />
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Descripción
            </Label>
            <Textarea
              id="description"
              placeholder="Descripción detallada de la familia de piezas..."
              rows={3}
              {...register("description")}
              onChange={handleDescriptionInput}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="defaultConcreteType" className="flex items-center gap-1">
              <Cpu className="w-4 h-4" />
              Tipo de Hormigón por Defecto
            </Label>
            <Input
              id="defaultConcreteType"
              placeholder="H-30"
              {...register("defaultConcreteType")}
              onChange={handleConcreteTypeInput}
            />
            {errors.defaultConcreteType && (
              <p className="text-sm text-destructive mt-1">{errors.defaultConcreteType.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Ejemplo: H-21, H-30, H-38
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Producción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresMold"
                {...register("requiresMold")}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="requiresMold" className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4" />
                Requiere molde específico
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Las piezas de esta familia necesitan un molde específico para su fabricación
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresCables"
                {...register("requiresCables")}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="requiresCables" className="flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4" />
                Requiere cables de pretensado
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Las piezas de esta familia utilizan cables para pretensado
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresVaporCycle"
                {...register("requiresVaporCycle")}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="requiresVaporCycle" className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4" />
                Requiere ciclo de curado a vapor
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Las piezas de esta familia necesitan curado a vapor para alcanzar las propiedades requeridas
            </p>
          </div>

          {/* Max Cables - Only show if requires cables */}
          {watchRequiresCables && (
            <div>
              <Label htmlFor="maxCables" className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                Máximo número de cables
              </Label>
              <Input
                id="maxCables"
                type="text"
                placeholder="12"
                {...register("maxCables")}
                onChange={handleMaxCablesInput}
                className="max-w-32"
              />
              {errors.maxCables && (
                <p className="text-sm text-destructive mt-1">{errors.maxCables.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Número máximo de cables que pueden utilizarse en piezas de esta familia
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : family ? "Actualizar Familia" : "Crear Familia"}
        </Button>
      </div>
    </form>
  );
}