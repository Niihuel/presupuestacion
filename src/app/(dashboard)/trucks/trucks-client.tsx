"use client";

import * as React from "react";
import useSWR from "swr";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RowActions } from "@/components/ui/row-actions";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { useCan } from "@/hooks/use-can";
import { usePermissionGuard } from "@/hooks/use-permission-guard";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";
import { toast } from "sonner";
import { 
  Plus, 
  Truck, 
  Search, 
  FilterX, 
  Check, 
  X,
  AlertTriangle
} from "lucide-react";
import { PageTransition, SectionTransition, CardTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

const TRUCK_TYPES = [
  { value: "STANDARD", label: "Estándar (≤12m)", details: "Hasta 25 toneladas, longitud máxima 12m" },
  { value: "MEDIUM", label: "Mediano (≤21.5m)", details: "Hasta 27 toneladas, longitud máxima 21.5m" },
  { value: "EXTENDED", label: "Extendido (≤30m)", details: "Hasta 36.6 toneladas, longitud máxima 30m" }
];

export default function TrucksClient() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [truckTypeFilter, setTruckTypeFilter] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<string>("");
  
  const { data, mutate, isLoading } = useSWR(
    `/api/trucks?page=${page}&pageSize=10&q=${encodeURIComponent(q)}${truckTypeFilter ? `&truckType=${truckTypeFilter}` : ''}${activeFilter ? `&active=${activeFilter}` : ''}`, 
    fetcher
  );
  
  const items = (data?.items ?? []) as any[];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / 10);
  
  const [openUnifiedModal, setOpenUnifiedModal] = React.useState(false);
  const [viewItem, setViewItem] = React.useState<any|null>(null);
  const [editItem, setEditItem] = React.useState<any|null>(null);
  const [deleteItem, setDeleteItem] = React.useState<any|null>(null);
  
  // Permission hooks
  const { guardAction } = usePermissionGuard();
  const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
  
  // Form state
  const [formData, setFormData] = React.useState({
    plate: "",
    brand: "",
    model: "",
    capacityTons: "",
    maxLength: "",
    maxPieces: "",
    isCompanyOwned: false,
    active: true,
    truckType: "STANDARD",
    minBillableTons: "",
    description: ""
  });
  
  const resetForm = () => {
    setFormData({
      plate: "",
      brand: "",
      model: "",
      capacityTons: "",
      maxLength: "",
      maxPieces: "",
      isCompanyOwned: false,
      active: true,
      truckType: "STANDARD",
      minBillableTons: "",
      description: ""
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };
  
  // Preset default values based on truck type
  React.useEffect(() => {
    if (formData.truckType === "STANDARD") {
      setFormData(prev => ({
        ...prev,
        capacityTons: prev.capacityTons || "25",
        maxLength: prev.maxLength || "12",
        minBillableTons: prev.minBillableTons || "21"
      }));
    } else if (formData.truckType === "MEDIUM") {
      setFormData(prev => ({
        ...prev,
        capacityTons: prev.capacityTons || "27",
        maxLength: prev.maxLength || "21.5",
        minBillableTons: prev.minBillableTons || "24"
      }));
    } else if (formData.truckType === "EXTENDED") {
      setFormData(prev => ({
        ...prev,
        capacityTons: prev.capacityTons || "36.6",
        maxLength: prev.maxLength || "30",
        minBillableTons: prev.minBillableTons || "26"
      }));
    }
  }, [formData.truckType]);
  
  // Set form data when editing
  React.useEffect(() => {
    if (editItem) {
      setFormData({
        plate: editItem.plate || "",
        brand: editItem.brand || "",
        model: editItem.model || "",
        capacityTons: editItem.capacityTons ? String(editItem.capacityTons) : "",
        maxLength: editItem.maxLength ? String(editItem.maxLength) : "",
        maxPieces: editItem.maxPieces ? String(editItem.maxPieces) : "",
        isCompanyOwned: editItem.isCompanyOwned || false,
        active: editItem.active ?? true,
        truckType: editItem.truckType || "STANDARD",
        minBillableTons: editItem.minBillableTons ? String(editItem.minBillableTons) : "",
        description: editItem.description || ""
      });
    } else {
      resetForm();
    }
  }, [editItem]);
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      if (editItem) {
        await axios.put(`/api/trucks/${editItem.id}`, formData);
        toast.success("Camión actualizado correctamente");
      } else {
        await axios.post("/api/trucks", formData);
        toast.success("Camión creado correctamente");
      }
      
      setOpenUnifiedModal(false);
      setEditItem(null);
      resetForm();
      mutate();
    } catch (error: any) {
      if (error.response?.status === 403) {
        handlePermissionError(error.response?.data?.error || "No tienes permisos para esta acción");
      } else {
        toast.error(error.response?.data?.error || "Error al guardar el camión");
      }
    }
  };
  
  // Delete truck
  const handleDelete = async () => {
    if (!deleteItem) return;
    
    try {
      await axios.delete(`/api/trucks/${deleteItem.id}`);
      toast.success("Camión eliminado correctamente");
      setDeleteItem(null);
      mutate();
    } catch (error: any) {
      if (error.response?.status === 403) {
        handlePermissionError(error.response?.data?.error || "No tienes permisos para esta acción");
      } else {
        toast.error(error.response?.data?.error || "Error al eliminar el camión");
      }
    }
  };
  
  // Clear filters
  const clearFilters = () => {
    setQ("");
    setTruckTypeFilter("");
    setActiveFilter("");
    setPage(1);
  };
  
  // Get truck type label
  const getTruckTypeLabel = (type: string) => {
    const truckType = TRUCK_TYPES.find(t => t.value === type);
    return truckType ? truckType.label : type;
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
              <Truck className="h-6 w-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Camiones</h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Administra la flota de camiones disponibles para el transporte de piezas
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Filters */}
      <SectionTransition delay={0.1} className="mb-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Filtros</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={e => { setPage(1); setQ(e.target.value) }}
                  placeholder="Buscar por placa, marca o modelo..."
                  className="pl-10"
                />
              </div>
              
              <Select
                value={truckTypeFilter}
                onChange={e => { setPage(1); setTruckTypeFilter(e.target.value) }}
              >
                <option value="">Todos los tipos</option>
                {TRUCK_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              
              <Select
                value={activeFilter}
                onChange={e => { setPage(1); setActiveFilter(e.target.value) }}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>
            </div>
            
            <div className="flex justify-between">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 transition-all duration-200">
                  <FilterX className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={guardAction("trucks", "create", () => setOpenUnifiedModal(true), {
                  customMessage: "Necesitas permisos para crear camiones"
                })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Camión
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </SectionTransition>
      
      {/* Trucks List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-900 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Placa</th>
                  <th className="text-left p-4 font-semibold">Marca / Modelo</th>
                  <th className="text-left p-4 font-semibold">Tipo</th>
                  <th className="text-left p-4 font-semibold">Capacidad</th>
                  <th className="text-left p-4 font-semibold">Estado</th>
                  <th className="text-left p-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="p-8 text-center text-muted-foreground" colSpan={6}>
                      Cargando...
                    </td>
                  </tr>
                ) : items.length ? (
                  items.map((truck, index) => (
                    <motion.tr 
                      key={truck.id} 
                      className="border-b hover:bg-muted/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-4 font-medium">{truck.plate}</td>
                      <td className="p-4">
                        {truck.brand} {truck.model ? `/ ${truck.model}` : ""}
                      </td>
                      <td className="p-4">{getTruckTypeLabel(truck.truckType)}</td>
                      <td className="p-4">
                        {truck.capacityTons} tn {truck.maxLength ? `/ ${truck.maxLength}m` : ""}
                      </td>
                      <td className="p-4">
                        {truck.active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" />
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <X className="w-4 h-4" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <RowActions
                          onView={() => setViewItem(truck)}
                          onEdit={guardAction("trucks", "edit", () => setEditItem(truck), {
                            customMessage: "Necesitas permisos para editar camiones"
                          })}
                          onDelete={guardAction("trucks", "delete", () => setDeleteItem(truck), {
                            customMessage: "Necesitas permisos para eliminar camiones"
                          })}
                        />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-8 text-center text-muted-foreground" colSpan={6}>
                      <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="mb-4">No se encontraron camiones</p>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={guardAction("trucks", "create", () => setOpenUnifiedModal(true), {
                            customMessage: "Necesitas permisos para crear camiones"
                          })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Crear primer camión
                        </Button>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {pageCount > 1 && (
        <Pagination
          currentPage={page}
          hasNextPage={page < pageCount}
          onPageChange={setPage}
        />
      )}
      
      {/* Create/Edit UnifiedModal */}
      <UnifiedModal
        open={openUnifiedModal || !!editItem}
        onClose={() => {
          setOpenUnifiedModal(false);
          setEditItem(null);
        }}
        title={editItem ? "Editar Camión" : "Nuevo Camión"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plate">Placa *</Label>
              <Input
                id="plate"
                name="plate"
                value={formData.plate}
                onChange={handleInputChange}
                required
                placeholder="AAA-123"
              />
            </div>
            
            <div>
              <Label htmlFor="truckType">Tipo de Camión *</Label>
              <Select
                id="truckType"
                name="truckType"
                value={formData.truckType}
                onChange={e => handleSelectChange("truckType", e.target.value)}
                required
              >
                {TRUCK_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {TRUCK_TYPES.find(t => t.value === formData.truckType)?.details}
              </p>
            </div>
            
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Mercedes-Benz"
              />
            </div>
            
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="Actros 2545"
              />
            </div>
            
            <div>
              <Label htmlFor="capacityTons">Capacidad (toneladas) *</Label>
              <Input
                id="capacityTons"
                name="capacityTons"
                type="number"
                step="0.1"
                value={formData.capacityTons}
                onChange={handleInputChange}
                required
                placeholder="25.0"
              />
            </div>
            
            <div>
              <Label htmlFor="maxLength">Longitud Máxima (metros) *</Label>
              <Input
                id="maxLength"
                name="maxLength"
                type="number"
                step="0.1"
                value={formData.maxLength}
                onChange={handleInputChange}
                required
                placeholder="12.0"
              />
            </div>
            
            <div>
              <Label htmlFor="maxPieces">Máximo de Piezas</Label>
              <Input
                id="maxPieces"
                name="maxPieces"
                type="number"
                value={formData.maxPieces}
                onChange={handleInputChange}
                placeholder="10"
              />
            </div>
            
            <div>
              <Label htmlFor="minBillableTons">Toneladas Mínimas Facturables *</Label>
              <Input
                id="minBillableTons"
                name="minBillableTons"
                type="number"
                step="0.1"
                value={formData.minBillableTons}
                onChange={handleInputChange}
                required
                placeholder="21.0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo a facturar para falso flete
              </p>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Información adicional sobre este camión..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isCompanyOwned"
                checked={formData.isCompanyOwned}
                onCheckedChange={(checked) => handleSwitchChange("isCompanyOwned", checked)}
              />
              <Label htmlFor="isCompanyOwned">Propiedad de la empresa</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleSwitchChange("active", checked)}
              />
              <Label htmlFor="active">Activo</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenUnifiedModal(false);
                setEditItem(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editItem ? "Actualizar" : "Crear"} Camión
            </Button>
          </div>
        </form>
      </UnifiedModal>
      
      {/* View Details UnifiedModal */}
      <UnifiedModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Detalles del Camión"
      >
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Placa</h4>
                <p className="font-medium">{viewItem.plate}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Tipo</h4>
                <p>{getTruckTypeLabel(viewItem.truckType)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Marca</h4>
                <p>{viewItem.brand || "-"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Modelo</h4>
                <p>{viewItem.model || "-"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Capacidad</h4>
                <p>{viewItem.capacityTons} toneladas</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Longitud Máxima</h4>
                <p>{viewItem.maxLength} metros</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Máximo de Piezas</h4>
                <p>{viewItem.maxPieces || "-"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Toneladas Mínimas Facturables</h4>
                <p>{viewItem.minBillableTons || "-"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Propiedad</h4>
                <p>{viewItem.isCompanyOwned ? "De la empresa" : "Tercerizado"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Estado</h4>
                <p>{viewItem.active ? "Activo" : "Inactivo"}</p>
              </div>
            </div>
            
            {viewItem.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Descripción</h4>
                <p>{viewItem.description}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setViewItem(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </UnifiedModal>
      
      {/* Delete Confirmation UnifiedModal */}
      <UnifiedModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Eliminar Camión"
      >
        {deleteItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">¿Está seguro de eliminar este camión?</p>
            </div>
            
            <p>
              Está a punto de eliminar el camión con placa <strong>{deleteItem.plate}</strong>.
              Esta acción no se puede deshacer.
            </p>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteItem(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </UnifiedModal>
      
      {/* Permission Error UnifiedModal */}
      <PermissionErrorModal />
    </PageTransition>
  );
}