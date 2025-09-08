'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';

interface MaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: any;
  onSuccess: () => void;
}

export function MaterialModal({ open, onOpenChange, material, onSuccess }: MaterialModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'hormigon',
    unit: 'm3',
    currentPrice: 0,
    supplier: '',
    minimumStock: 0,
    changeReason: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (material) {
      setFormData({
        code: material.code,
        name: material.name,
        category: material.category,
        unit: material.unit,
        currentPrice: material.currentPrice,
        supplier: material.supplier || '',
        minimumStock: material.minimumStock || 0,
        changeReason: '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'hormigon',
        unit: 'm3',
        currentPrice: 0,
        supplier: '',
        minimumStock: 0,
        changeReason: '',
      });
    }
  }, [material]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (material) {
        await axios.patch(`/api/materials/${material.id}`, formData);
        toast.success('Material actualizado correctamente');
      } else {
        await axios.post('/api/materials', formData);
        toast.success('Material creado correctamente');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('No se pudo guardar el material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{material ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={!!material}
              />
            </div>
            
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hormigon">Hormigón</SelectItem>
                  <SelectItem value="acero">Acero</SelectItem>
                  <SelectItem value="aditivo">Aditivo</SelectItem>
                  <SelectItem value="accesorio">Accesorio</SelectItem>
                  <SelectItem value="energia">Energía</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="unit">Unidad</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m3">m³</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lt">lt</SelectItem>
                  <SelectItem value="un">un</SelectItem>
                  <SelectItem value="kWh">kWh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="currentPrice">Precio Actual</Label>
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="minimumStock">Stock Mínimo</Label>
              <Input
                id="minimumStock"
                type="number"
                step="0.01"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) })}
              />
            </div>
            
            {material && (
              <div className="col-span-2">
                <Label htmlFor="changeReason">Motivo del cambio de precio</Label>
                <Textarea
                  id="changeReason"
                  value={formData.changeReason}
                  onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                  placeholder="Opcional: explique el motivo del cambio de precio"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
