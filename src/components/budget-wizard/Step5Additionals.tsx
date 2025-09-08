'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wrench, Users, HardHat, Paintbrush, Zap, Package, PlusIcon, SearchIcon, TrashIcon } from 'lucide-react';
import axios from 'axios';

// Create a simple toast hook for notifications
const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: 'destructive' }) => {
      if (variant === 'destructive') {
        alert(`Error: ${title}${description ? ' - ' + description : ''}`);
      } else {
        alert(`${title}${description ? ' - ' + description : ''}`);
      }
    }
  };
};

// Simple Dialog components
const DialogTrigger = ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean }) => {
  return <div {...props}>{children}</div>;
};

const DialogDescription = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-sm text-gray-600 mt-2">{children}</p>;
};

// Format currency utility
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(value);
};

interface Step5AdditionalsProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Additional {
  id: string;
  description: string;
  unit: string;
  price: number;
  category: string | null;
  isActive: boolean;
}

interface SelectedAdditional {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
  category: string | null;
}

export default function Step5Additionals({ data, onUpdate, onNext, onBack }: Step5AdditionalsProps) {
  const [loading, setLoading] = useState(false);
  const [complexity, setComplexity] = useState(data.additionals?.complexity || 'medium');
  const [estimatedDays, setEstimatedDays] = useState(data.additionals?.estimatedDays || 0);
  const [assemblyDays, setAssemblyDays] = useState(data.additionals?.assemblyDays || 0);
  const [craneDays, setCraneDays] = useState(data.additionals?.craneDays || 0);
  
  // Servicios de montaje
  const [crane, setCrane] = useState(data.additionals?.montageServices?.crane || { enabled: false });
  const [crew, setCrew] = useState(data.additionals?.montageServices?.crew || { enabled: true, size: 4 });
  const [supervisor, setSupervisor] = useState(data.additionals?.montageServices?.supervisor || { enabled: false });
  
  // Trabajos adicionales
  const [waterproofing, setWaterproofing] = useState(data.additionals?.additionalWork?.waterproofing || { enabled: false });
  const [neoprenes, setNeoprenes] = useState(data.additionals?.additionalWork?.neoprenes || { enabled: false });
  const [specialWelding, setSpecialWelding] = useState(data.additionals?.additionalWork?.specialWelding || { enabled: false });
  const [jointFilling, setJointFilling] = useState(data.additionals?.additionalWork?.jointFilling || { enabled: true });
  const [fireproofPaint, setFireproofPaint] = useState(data.additionals?.additionalWork?.fireproofPaint || { enabled: false });
  
  // Equipamiento especial
  const [scaffolding, setScaffolding] = useState(data.additionals?.specialEquipment?.scaffolding || { enabled: false });
  const [liftingEquipment, setLiftingEquipment] = useState(data.additionals?.specialEquipment?.liftingEquipment || { enabled: false });
  const [generators, setGenerators] = useState(data.additionals?.specialEquipment?.generators || { enabled: false });
  
  // Additional Catalog Integration
  const [catalogAdditionals, setCatalogAdditionals] = useState<Additional[]>([]);
  const [selectedAdditionals, setSelectedAdditionals] = useState<SelectedAdditional[]>(data.additionals?.catalogAdditionals || []);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  
  const [totalMontageCost, setTotalMontageCost] = useState(0);
  const [totalAdditionalsCost, setTotalAdditionalsCost] = useState(0);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Load Additional catalog on component mount
  useEffect(() => {
    calculateAdditionals();
    loadCatalogAdditionals();
  }, []);

  // Load additionals from catalog
  const loadCatalogAdditionals = async () => {
    try {
      setCatalogLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        isActive: 'true',
      });
      
      if (catalogSearch) params.append('search', catalogSearch);
      if (catalogCategory) params.append('category', catalogCategory);
      
      const response = await fetch(`/api/additionals?${params}`);
      if (!response.ok) throw new Error('Error loading catalog');
      
      const data = await response.json();
      setCatalogAdditionals(data.additionals);
    } catch (error) {
      console.error('Error loading additionals catalog:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el catálogo de adicionales',
        variant: 'destructive',
      });
    } finally {
      setCatalogLoading(false);
    }
  };

  // Reload catalog when search or category changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isCatalogModalOpen) {
        loadCatalogAdditionals();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [catalogSearch, catalogCategory, isCatalogModalOpen]);

  // Add additional from catalog
  const addAdditionalFromCatalog = (additional: Additional) => {
    const exists = selectedAdditionals.find(sa => sa.id === additional.id);
    if (exists) {
      toast({
        title: 'Ya agregado',
        description: 'Este adicional ya está en la lista',
        variant: 'destructive',
      });
      return;
    }

    const newAdditional: SelectedAdditional = {
      id: additional.id,
      description: additional.description,
      unit: additional.unit,
      unitPrice: additional.price,
      quantity: 1,
      total: additional.price,
      category: additional.category,
    };

    const updated = [...selectedAdditionals, newAdditional];
    setSelectedAdditionals(updated);
    updateAdditionalData(updated);

    toast({
      title: 'Adicional agregado',
      description: `${additional.description} agregado exitosamente`,
    });
  };

  // Update additional quantity
  const updateAdditionalQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeAdditional(id);
      return;
    }

    const updated = selectedAdditionals.map(additional => {
      if (additional.id === id) {
        return {
          ...additional,
          quantity,
          total: additional.unitPrice * quantity,
        };
      }
      return additional;
    });

    setSelectedAdditionals(updated);
    updateAdditionalData(updated);
  };

  // Remove additional
  const removeAdditional = (id: string) => {
    const updated = selectedAdditionals.filter(additional => additional.id !== id);
    setSelectedAdditionals(updated);
    updateAdditionalData(updated);
  };

  // Update additional data in parent
  const updateAdditionalData = (additionals: SelectedAdditional[]) => {
    const catalogAdditionalsCost = additionals.reduce((sum, add) => sum + add.total, 0);
    const updatedData = {
      ...data,
      additionals: {
        ...data.additionals,
        catalogAdditionals: additionals,
        catalogAdditionalsCost,
      }
    };
    onUpdate(updatedData);
  };

  const calculateAdditionals = async () => {
    setLoading(true);

    try {
      // Calcular datos del proyecto
      const totalPieces = data.pieces?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 0;
      const totalWeight = data.freight?.totalRealWeight || 0;
      const maxHeight = Math.max(...(data.pieces?.map((p: any) => p.piece?.height || 6) || [6]));
      const projectArea = totalPieces * 50; // Estimación de área

      const response = await axios.post('/api/budget/additionals', {
        pieceCount: totalPieces,
        totalWeight,
        maxHeight,
        projectArea,
        complexity,
        hasEnergyOnSite: !generators.enabled,
        mobilizationDistance: data.distance?.billedDistance || 0
      });

      const result = response.data;
      
      // Actualizar estados con sugerencias
      setEstimatedDays(result.estimatedDays);
      setCrane(result.montageServices.crane);
      setCrew(result.montageServices.crew);
      setSupervisor(result.montageServices.supervisor);
      setNeoprenes(result.additionalWork.neoprenes);
      setJointFilling(result.additionalWork.jointFilling);
      setTotalMontageCost(result.totalMontageCost);
      setTotalAdditionalsCost(result.totalAdditionalsCost);
      setRecommendations(result.recommendations || []);

      updateData();
    } catch (error) {
      console.error('Error calculating additionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = () => {
    const catalogAdditionalsCost = selectedAdditionals.reduce((sum, add) => sum + add.total, 0);
    
    // Calculate assembly costs
    const assemblyCost = assemblyDays * 45000; // Base assembly rate per day
    const craneCost = craneDays * 60000; // Base crane rate per day
    const totalAssemblyCost = assemblyCost + craneCost;
    
    const additionals = {
      montageServices: { crane, crew, supervisor },
      additionalWork: { waterproofing, neoprenes, specialWelding, jointFilling, fireproofPaint },
      specialEquipment: { scaffolding, liftingEquipment, generators },
      catalogAdditionals: selectedAdditionals,
      catalogAdditionalsCost,
      estimatedDays,
      assemblyDays,
      craneDays,
      assemblyCost,
      craneCost,
      totalAssemblyCost,
      complexity,
      totalMontageCost: totalMontageCost + totalAssemblyCost,
      totalAdditionalsCost
    };

    onUpdate({
      ...data,
      additionals
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Configuración General */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <Label>Complejidad de la Obra</Label>
            <Select value={complexity} onValueChange={setComplexity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="complex">Compleja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Días Estimados Total</Label>
            <Input
              type="number"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(parseInt(e.target.value))}
              min="1"
            />
          </div>
          <div>
            <Label>Días de Montaje</Label>
            <Input
              type="number"
              value={assemblyDays}
              onChange={(e) => setAssemblyDays(parseInt(e.target.value))}
              min="0"
              placeholder="Días montaje"
            />
          </div>
          <div>
            <Label>Días de Grúa</Label>
            <Input
              type="number"
              value={craneDays}
              onChange={(e) => setCraneDays(parseInt(e.target.value))}
              min="0"
              placeholder="Días grúa"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={calculateAdditionals} disabled={loading} variant="outline">
              {loading ? 'Calculando...' : 'Recalcular Sugerencias'}
            </Button>
          </div>
        </div>
        
        {/* Cost breakdown for assembly and crane */}
        {(assemblyDays > 0 || craneDays > 0) && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Cálculo de Montaje</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {assemblyDays > 0 && (
                <div>
                  <span className="text-blue-700">Montaje: {assemblyDays} días</span>
                  <div className="text-blue-600 font-semibold">
                    {formatCurrency(assemblyDays * 45000)} {/* Base assembly rate */}
                  </div>
                </div>
              )}
              {craneDays > 0 && (
                <div>
                  <span className="text-blue-700">Grúa: {craneDays} días</span>
                  <div className="text-blue-600 font-semibold">
                    {formatCurrency(craneDays * 60000)} {/* Base crane rate */}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Servicios de Montaje */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Servicios de Montaje
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Grúa</p>
                <p className="text-sm text-gray-600">
                  {crane.tonnageCategory === 'under100' && 'Menos de 100 toneladas'}
                  {crane.tonnageCategory === '100to300' && 'Entre 100-300 toneladas'}
                  {crane.tonnageCategory === 'over300' && 'Más de 300 toneladas'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {crane.enabled && (
                <span className="font-semibold text-green-600">
                  {formatCurrency(crane.cost || 0)}
                </span>
              )}
              <Switch
                checked={crane.enabled}
                onCheckedChange={(checked: boolean) => setCrane({ ...crane, enabled: checked })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Cuadrilla de Montaje</p>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={crew.size}
                    onChange={(e) => setCrew({ ...crew, size: parseInt(e.target.value) })}
                    className="w-20 h-8"
                    min="4"
                    max="10"
                    disabled={!crew.enabled}
                  />
                  <span className="text-sm text-gray-600">personas × {estimatedDays} días</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {crew.enabled && (
                <span className="font-semibold text-green-600">
                  {formatCurrency(crew.cost || 0)}
                </span>
              )}
              <Switch
                checked={crew.enabled}
                onCheckedChange={(checked: boolean) => setCrew({ ...crew, enabled: checked })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <HardHat className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Supervisor de Montaje</p>
                <p className="text-sm text-gray-600">{estimatedDays} días</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {supervisor.enabled && (
                <span className="font-semibold text-green-600">
                  {formatCurrency(supervisor.cost || 0)}
                </span>
              )}
              <Switch
                checked={supervisor.enabled}
                onCheckedChange={(checked: boolean) => setSupervisor({ ...supervisor, enabled: checked })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Trabajos Complementarios */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Paintbrush className="h-5 w-5" />
          Trabajos Complementarios
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Impermeabilización</p>
              <p className="text-sm text-gray-600">
                {waterproofing.quantity || 0} unidades
              </p>
            </div>
            <Switch
              checked={waterproofing.enabled}
              onCheckedChange={(checked: boolean) => setWaterproofing({ ...waterproofing, enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Neoprenos</p>
              <p className="text-sm text-gray-600">{neoprenes.quantity || 0} unidades</p>
            </div>
            <Switch
              checked={neoprenes.enabled}
              onCheckedChange={(checked: boolean) => setNeoprenes({ ...neoprenes, enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Soldadura Especial</p>
              <p className="text-sm text-gray-600">{specialWelding.meters || 0} metros</p>
            </div>
            <Switch
              checked={specialWelding.enabled}
              onCheckedChange={(checked: boolean) => setSpecialWelding({ ...specialWelding, enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Relleno de Juntas</p>
              <p className="text-sm text-gray-600">{jointFilling.meters || 0} metros</p>
            </div>
            <Switch
              checked={jointFilling.enabled}
              onCheckedChange={(checked: boolean) => setJointFilling({ ...jointFilling, enabled: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Equipamiento Especial */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Equipamiento Especial
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Andamios</p>
              <p className="text-sm text-gray-600">{estimatedDays} días</p>
            </div>
            <Switch
              checked={scaffolding.enabled}
              onCheckedChange={(checked: boolean) => setScaffolding({ ...scaffolding, enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Equipo de Izaje</p>
              <p className="text-sm text-gray-600">Especial</p>
            </div>
            <Switch
              checked={liftingEquipment.enabled}
              onCheckedChange={(checked: boolean) => setLiftingEquipment({ ...liftingEquipment, enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Generadores</p>
              <p className="text-sm text-gray-600">{generators.quantity || 0} unidades</p>
            </div>
            <Switch
              checked={generators.enabled}
              onCheckedChange={(checked: boolean) => setGenerators({ ...generators, enabled: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Additional Services from Catalog */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Servicios Adicionales del Catálogo
          </h3>
          <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar del Catálogo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Catálogo de Servicios Adicionales</DialogTitle>
                <DialogDescription>
                  Selecciona servicios del catálogo para agregar al presupuesto
                </DialogDescription>
              </DialogHeader>
              
              {/* Search and Filters */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar servicios..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={catalogCategory} onValueChange={setCatalogCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las categorías</SelectItem>
                    <SelectItem value="Montaje">Montaje</SelectItem>
                    <SelectItem value="Transporte Especial">Transporte Especial</SelectItem>
                    <SelectItem value="Servicios Técnicos">Servicios Técnicos</SelectItem>
                    <SelectItem value="Materiales Adicionales">Materiales Adicionales</SelectItem>
                    <SelectItem value="Mano de Obra">Mano de Obra</SelectItem>
                    <SelectItem value="Equipos">Equipos</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Catalog Items */}
              <div className="max-h-96 overflow-y-auto">
                {catalogLoading ? (
                  <div className="text-center py-8 text-gray-500">Cargando catálogo...</div>
                ) : catalogAdditionals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron servicios adicionales
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {catalogAdditionals.map((additional) => (
                      <div
                        key={additional.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-medium">{additional.description}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{additional.unit}</Badge>
                                {additional.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {additional.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(additional.price)}
                          </span>
                          <Button
                            onClick={() => addAdditionalFromCatalog(additional)}
                            disabled={selectedAdditionals.some(sa => sa.id === additional.id)}
                          >
                            {selectedAdditionals.some(sa => sa.id === additional.id)
                              ? 'Agregado'
                              : 'Agregar'
                            }
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setIsCatalogModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Selected Additional Services */}
        {selectedAdditionals.length > 0 ? (
          <div className="space-y-3">
            {selectedAdditionals.map((additional) => (
              <div
                key={additional.id}
                className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium">{additional.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{additional.unit}</Badge>
                    {additional.category && (
                      <Badge variant="secondary" className="text-xs">
                        {additional.category}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-600">
                      {formatCurrency(additional.unitPrice)} / {additional.unit}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={additional.quantity}
                    onChange={(e) => updateAdditionalQuantity(additional.id, parseFloat(e.target.value) || 0)}
                    className="w-20"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-sm text-gray-600 min-w-[60px]">{additional.unit}</span>
                </div>
                
                <div className="text-right min-w-[100px]">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(additional.total)}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => removeAdditional(additional.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <div className="border-t pt-3 mt-4">
              <div className="flex justify-between items-center font-semibold">
                <span>Subtotal Servicios del Catálogo:</span>
                <span className="text-green-600">
                  {formatCurrency(selectedAdditionals.reduce((sum, add) => sum + add.total, 0))}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay servicios adicionales seleccionados del catálogo.
            <br />
            <Button
              variant="ghost"
              onClick={() => setIsCatalogModalOpen(true)}
              className="mt-2"
            >
              Agregar del catálogo
            </Button>
          </div>
        )}
      </Card>

      {/* Resumen de Costos */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Resumen de Costos</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Servicios de Montaje</span>
            <span className="font-semibold">{formatCurrency(totalMontageCost)}</span>
          </div>
          <div className="flex justify-between">
            <span>Trabajos Adicionales</span>
            <span className="font-semibold">{formatCurrency(totalAdditionalsCost)}</span>
          </div>
          <div className="flex justify-between">
            <span>Servicios del Catálogo</span>
            <span className="font-semibold">
              {formatCurrency(selectedAdditionals.reduce((sum, add) => sum + add.total, 0))}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Total Montaje y Adicionales</span>
            <span className="text-green-600">
              {formatCurrency(
                totalMontageCost + 
                totalAdditionalsCost + 
                selectedAdditionals.reduce((sum, add) => sum + add.total, 0)
              )}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button onClick={() => { updateData(); onNext(); }}>
          Siguiente: Resumen y Condiciones
        </Button>
      </div>
    </div>
  );
}
