'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

interface MonthlyIndexModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index: any;
  onSuccess: () => void;
}

export function MonthlyIndexModal({ open, onOpenChange, index, onSuccess }: MonthlyIndexModalProps) {
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    steelIndex: 100,
    laborIndex: 100,
    concreteIndex: 100,
    fuelIndex: 100,
    dollar: 1000,
    source: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  useEffect(() => {
    if (index) {
      setFormData({
        month: index.month,
        year: index.year,
        steelIndex: index.steelIndex,
        laborIndex: index.laborIndex,
        concreteIndex: index.concreteIndex,
        fuelIndex: index.fuelIndex,
        dollar: index.dollar || 1000,
        source: index.source || '',
        notes: index.notes || '',
      });
    } else {
      setFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        steelIndex: 100,
        laborIndex: 100,
        concreteIndex: 100,
        fuelIndex: 100,
        dollar: 1000,
        source: '',
        notes: '',
      });
    }
  }, [index]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        month: formData.month,
        year: formData.year,
        steelIndex: formData.steelIndex,
        laborIndex: formData.laborIndex,
        concreteIndex: formData.concreteIndex,
        fuelIndex: formData.fuelIndex,
        dollar: formData.dollar,
        source: formData.source,
        notes: formData.notes,
      };

      if (index) {
        await axios.patch(`/api/monthly-indices/${index.id}`, payload);
        toast.success('Índice mensual actualizado correctamente');
      } else {
        await axios.post('/api/monthly-indices', payload);
        toast.success('Índice mensual creado correctamente');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo guardar el índice mensual');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{index ? 'Editar Índice Mensual' : 'Nuevo Índice Mensual'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="month">Mes</Label>
              <Select
                value={formData.month.toString()}
                onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
                min="2020"
                max="2030"
              />
            </div>
            
            <div>
              <Label htmlFor="steelIndex">Índice Acero</Label>
              <Input
                id="steelIndex"
                type="number"
                step="0.001"
                value={formData.steelIndex}
                onChange={(e) => setFormData({ ...formData, steelIndex: parseFloat(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="laborIndex">Índice Mano de Obra</Label>
              <Input
                id="laborIndex"
                type="number"
                step="0.001"
                value={formData.laborIndex}
                onChange={(e) => setFormData({ ...formData, laborIndex: parseFloat(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="concreteIndex">Índice Hormigón</Label>
              <Input
                id="concreteIndex"
                type="number"
                step="0.001"
                value={formData.concreteIndex}
                onChange={(e) => setFormData({ ...formData, concreteIndex: parseFloat(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="fuelIndex">Índice Combustible</Label>
              <Input
                id="fuelIndex"
                type="number"
                step="0.001"
                value={formData.fuelIndex}
                onChange={(e) => setFormData({ ...formData, fuelIndex: parseFloat(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="dollar">Dólar</Label>
              <Input
                id="dollar"
                type="number"
                step="0.01"
                value={formData.dollar}
                onChange={(e) => setFormData({ ...formData, dollar: parseFloat(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="source">Fuente</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Ej: INDEC, Cámara de la Construcción"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional sobre estos índices..."
                rows={3}
              />
            </div>
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