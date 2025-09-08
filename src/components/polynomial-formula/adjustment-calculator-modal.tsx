'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

interface AdjustmentCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustmentCalculatorModal({ open, onOpenChange }: AdjustmentCalculatorModalProps) {
  const [baseMonth, setBaseMonth] = useState('');
  const [baseYear, setBaseYear] = useState('');
  const [targetMonth, setTargetMonth] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const years = ['2024', '2023', '2022', '2021', '2020'];

  const handleCalculate = async () => {
    if (!baseMonth || !baseYear || !targetMonth || !targetYear) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/monthly-indices/calculate', {
        baseMonth: parseInt(baseMonth),
        baseYear: parseInt(baseYear),
        targetMonth: parseInt(targetMonth),
        targetYear: parseInt(targetYear),
      });
      
      setResult(response.data);
      toast.success(`Ajuste calculado: ${response.data.adjustmentPercentage.toFixed(2)}%`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo calcular el ajuste');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setBaseMonth('');
    setBaseYear('');
    setTargetMonth('');
    setTargetYear('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Calculadora de Ajuste por Fórmula Polinómica</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Período Base</h3>
              <div>
                <Label htmlFor="baseMonth">Mes</Label>
                <Select value={baseMonth} onValueChange={setBaseMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="baseYear">Año</Label>
                <Select value={baseYear} onValueChange={setBaseYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Período Objetivo</h3>
              <div>
                <Label htmlFor="targetMonth">Mes</Label>
                <Select value={targetMonth} onValueChange={setTargetMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetYear">Año</Label>
                <Select value={targetYear} onValueChange={setTargetYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {result && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Resultado del Cálculo</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Factor Acero</p>
                      <p className="font-medium">{(result.factors.steel * 100).toFixed(3)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Factor Mano de Obra</p>
                      <p className="font-medium">{(result.factors.labor * 100).toFixed(3)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Factor Hormigón</p>
                      <p className="font-medium">{(result.factors.concrete * 100).toFixed(3)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Factor Combustible</p>
                      <p className="font-medium">{(result.factors.fuel * 100).toFixed(3)}%</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">Factor Total</p>
                      <p className="text-lg font-bold">{result.totalFactor.toFixed(4)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="font-semibold">Porcentaje de Ajuste</p>
                      <p className="text-lg font-bold text-primary">
                        {result.adjustmentPercentage > 0 ? '+' : ''}{result.adjustmentPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t text-sm text-gray-600">
                    <p>Coeficientes utilizados:</p>
                    <ul className="mt-1 space-y-1">
                      <li>Acero: {result.coefficients.steelCoefficient}</li>
                      <li>Mano de Obra: {result.coefficients.laborCoefficient}</li>
                      <li>Hormigón: {result.coefficients.concreteCoefficient}</li>
                      <li>Combustible: {result.coefficients.fuelCoefficient}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
          <Button onClick={handleCalculate} disabled={loading}>
            <Calculator className="mr-2 h-4 w-4" />
            {loading ? 'Calculando...' : 'Calcular Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
