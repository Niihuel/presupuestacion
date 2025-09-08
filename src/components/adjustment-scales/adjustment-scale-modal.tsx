'use client';

import { useState, useEffect } from 'react';
import { UnifiedModal } from '@/components/ui/unified-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AdjustmentScaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scale: any;
  onSuccess: () => void;
}

export function AdjustmentScaleModal({ open, onOpenChange, scale, onSuccess }: AdjustmentScaleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    version: 1,
    description: '',
    generalDiscount: -15.0,
    generalAdjustment: 311.365,
    specialAdjustment: -20.0,
    specialCategories: 'TT,PLACAS_PLANAS',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    expirationDate: '',
    isActive: false,
    scales: '[]',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scale) {
      setFormData({
        name: scale.name,
        version: scale.version,
        description: scale.description || '',
        generalDiscount: scale.generalDiscount,
        generalAdjustment: scale.generalAdjustment,
        specialAdjustment: scale.specialAdjustment || -20.0,
        specialCategories: scale.specialCategories || 'TT,PLACAS_PLANAS',
        effectiveDate: format(new Date(scale.effectiveDate), 'yyyy-MM-dd'),
        expirationDate: scale.expirationDate ? format(new Date(scale.expirationDate), 'yyyy-MM-dd') : '',
        isActive: scale.isActive,
        scales: scale.scales || '[]',
      });
    } else {
      // For new scale, calculate next version
      setFormData({
        name: '',
        version: 1,
        description: '',
        generalDiscount: -15.0,
        generalAdjustment: 311.365,
        specialAdjustment: -20.0,
        specialCategories: 'TT,PLACAS_PLANAS',
        effectiveDate: format(new Date(), 'yyyy-MM-dd'),
        expirationDate: '',
        isActive: false,
        scales: '[]',
      });
    }
  }, [scale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
      };

      if (scale) {
        await axios.patch(`/api/adjustment-scales/${scale.id}`, data);
        toast.success('Escala de ajuste actualizada correctamente');
      } else {
        await axios.post('/api/adjustment-scales', data);
        toast.success('Escala de ajuste creada correctamente');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo guardar la escala de ajuste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedModal 
      open={open} 
      onOpenChange={onOpenChange} 
      title={scale ? 'Editar Escala de Ajuste' : 'Nueva Escala de Ajuste'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ej: Escala Q1 2024"
              />
            </div>
            
            <div>
              <Label htmlFor="version">Versión</Label>
              <Input
                id="version"
                type="number"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) })}
                required
                min="1"
              />
            </div>
            
            <div>
              <Label htmlFor="effectiveDate">Fecha Efectiva</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="expirationDate">Fecha de Expiración (opcional)</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="generalDiscount">Descuento General (%)</Label>
              <Input
                id="generalDiscount"
                type="number"
                step="0.01"
                value={formData.generalDiscount}
                onChange={(e) => setFormData({ ...formData, generalDiscount: parseFloat(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="generalAdjustment">Ajuste General (%)</Label>
              <Input
                id="generalAdjustment"
                type="number"
                step="0.01"
                value={formData.generalAdjustment}
                onChange={(e) => setFormData({ ...formData, generalAdjustment: parseFloat(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="specialAdjustment">Ajuste Especial (%) - opcional</Label>
              <Input
                id="specialAdjustment"
                type="number"
                step="0.01"
                value={formData.specialAdjustment}
                onChange={(e) => setFormData({ ...formData, specialAdjustment: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="specialCategories">Categorías Especiales</Label>
              <Input
                id="specialCategories"
                value={formData.specialCategories}
                onChange={(e) => setFormData({ ...formData, specialCategories: e.target.value })}
                placeholder="TT,PLACAS_PLANAS"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Información adicional sobre esta escala de ajuste..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Activar esta escala</Label>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </UnifiedModal>
  );
}