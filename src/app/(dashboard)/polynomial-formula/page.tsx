'use client';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { MonthlyIndexModal } from '@/components/polynomial-formula/monthly-index-modal';
import { AdjustmentCalculatorModal } from '@/components/polynomial-formula/adjustment-calculator-modal';
import axios from 'axios';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageTransition, SectionTransition, CardTransition } from '@/components/ui/page-transition';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';

// Type definitions
interface MonthlyIndex {
  id: string;
  month: number;
  year: number;
  steelIndex: number;
  laborIndex: number;
  concreteIndex: number;
  fuelIndex: number;
  dollar: number;
  source?: string;
}

interface PolynomialFormula {
  id: string;
  name: string;
  steelWeight: number;
  laborWeight: number;
  concreteWeight: number;
  dieselWeight: number;
}

// Column type matching the DataTable component
interface Column {
  accessorKey?: string;
  header: string;
  cell?: ({ row }: { row: { original: MonthlyIndex } }) => React.ReactNode;
  id?: string;
}

export default function PolynomialFormulaPage() {
  const [indices, setIndices] = useState<MonthlyIndex[]>([]);
  const [formula, setFormula] = useState<PolynomialFormula | null>(null);
  const [loading, setLoading] = useState(true);
  const [indexModalOpen, setIndexModalOpen] = useState(false);
  const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<MonthlyIndex | null>(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [initializing, setInitializing] = useState(false);
  
  // Coeficientes de la fórmula polinómica
  const [coefficients, setCoefficients] = useState({
    name: 'Fórmula Polinómica Estándar',
    steelWeight: 0.4,
    laborWeight: 0.3,
    concreteWeight: 0.2,
    dieselWeight: 0.1
  });

  const fetchIndices = async (): Promise<void> => {
    try {
      setLoading(true);
      const params = yearFilter ? `?year=${yearFilter}` : '';
      const response = await axios.get<MonthlyIndex[]>(`/api/monthly-indices${params}`);
      setIndices(response.data);
    } catch (error) {
      toast.error('No se pudieron cargar los índices mensuales');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormula = async (): Promise<void> => {
    try {
      const response = await axios.get<PolynomialFormula[]>('/api/polynomial-formula');
      if (response.data.length > 0) {
        setFormula(response.data[0]);
        setCoefficients({
          name: response.data[0].name || 'Fórmula Polinómica Estándar',
          steelWeight: response.data[0].steelWeight || 0.4,
          laborWeight: response.data[0].laborWeight || 0.3,
          concreteWeight: response.data[0].concreteWeight || 0.2,
          dieselWeight: response.data[0].dieselWeight || 0.1
        });
      } else {
        // Reset to default values when no formula exists
        setFormula(null);
        setCoefficients({
          name: 'Fórmula Polinómica Estándar',
          steelWeight: 0.4,
          laborWeight: 0.3,
          concreteWeight: 0.2,
          dieselWeight: 0.1
        });
      }
    } catch (error) {
      toast.error('No se pudo cargar la fórmula polinómica');
    }
  };

  const initializeFormula = async (): Promise<void> => {
    setInitializing(true);
    try {
      const response = await axios.post('/api/polynomial-formula/initialize');
      toast.success(response.data.message);
      fetchFormula();
    } catch (error) {
      toast.error('No se pudo inicializar la fórmula polinómica');
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    fetchFormula();
  }, [yearFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este índice?')) return;
    
    try {
      await axios.delete(`/api/monthly-indices/${id}`);
      toast.success('Índice eliminado correctamente');
      fetchIndices();
    } catch (error) {
      toast.error('No se pudo eliminar el índice');
    }
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const columns: Column[] = [
    {
      accessorKey: 'month',
      header: 'Mes',
      cell: ({ row }: { row: { original: MonthlyIndex } }) => months[row.original.month - 1],
    },
    {
      accessorKey: 'year',
      header: 'Año',
    },
    {
      accessorKey: 'steelIndex',
      header: 'Índice Acero',
      cell: ({ row }: { row: { original: MonthlyIndex } }) => row.original.steelIndex.toFixed(3),
    },
    {
      accessorKey: 'laborIndex',
      header: 'Índice Mano de Obra',
      cell: ({ row }: { row: { original: MonthlyIndex } }) => row.original.laborIndex.toFixed(3),
    },
    {
      accessorKey: 'concreteIndex',
      header: 'Índice Hormigón',
      cell: ({ row }: { row: { original: MonthlyIndex } }) => row.original.concreteIndex.toFixed(3),
    },
    {
      accessorKey: 'fuelIndex',
      header: 'Índice Combustible',
      cell: ({ row }: { row: { original: MonthlyIndex } }) => row.original.fuelIndex.toFixed(3),
    },
    {
      accessorKey: 'dollar',
      header: 'Dólar',
      cell: ({ row }: { row: { original: MonthlyIndex } }) => row.original.dollar.toFixed(2),
    },
    {
      accessorKey: 'source',
      header: 'Fuente',
      cell: ({ row }: { row: { original: MonthlyIndex } }) => row.original.source || '-',
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }: { row: { original: MonthlyIndex } }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  const handleCoefficientUpdate = async (): Promise<void> => {
    const total = coefficients.steelWeight + coefficients.laborWeight + coefficients.concreteWeight + coefficients.dieselWeight;
    if (Math.abs(total - 1) > 0.001) {
      toast.error('La suma de los coeficientes debe ser igual a 1');
      return;
    }

    try {
      if (formula) {
        // Update existing formula
        await axios.put(`/api/polynomial-formula/${formula.id}`, {
          ...coefficients
        });
        toast.success('Coeficientes actualizados correctamente');
      } else {
        // Create new formula
        const response = await axios.post('/api/polynomial-formula', coefficients);
        setFormula(response.data);
        toast.success('Fórmula creada correctamente');
      }
      fetchFormula();
    } catch (error) {
      toast.error('No se pudieron actualizar los coeficientes');
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Fórmula Polinómica"
        description="Gestione los índices mensuales y calcule ajustes de precios"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCalculatorModalOpen(true)}
          >
            <Calculator className="mr-2 h-4 w-4" />
            Calcular Ajuste
          </Button>
          <Button
            onClick={() => {
              setSelectedIndex(null);
              setIndexModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Índice
          </Button>
        </div>
      </PageHeader>

      {!formula && (
        <SectionTransition delay={0.1}>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fórmula no inicializada</AlertTitle>
            <AlertDescription>
              No se ha encontrado una fórmula polinómica en el sistema. 
              <Button 
                variant="link" 
                onClick={initializeFormula}
                disabled={initializing}
                className="px-2"
              >
                {initializing ? 'Inicializando...' : 'Haga clic aquí para crear la fórmula predeterminada'}
              </Button>
            </AlertDescription>
          </Alert>
        </SectionTransition>
      )}

      <SectionTransition delay={0.2}>
        <Tabs defaultValue="indices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="indices">Índices Mensuales</TabsTrigger>
            <TabsTrigger value="formula">Coeficientes de Fórmula</TabsTrigger>
          </TabsList>

          <TabsContent value="indices" className="space-y-4">
            <CardTransition>
              <div className="flex gap-4 mb-4">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por año" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2023, 2022, 2021, 2020].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DataTable
                columns={columns}
                data={indices}
                loading={loading}
              />
            </CardTransition>
          </TabsContent>

          <TabsContent value="formula" className="space-y-4">
            <CardTransition>
              <Card>
                <CardHeader>
                  <CardTitle>Coeficientes de la Fórmula Polinómica</CardTitle>
                  <CardDescription>
                    Los coeficientes determinan el peso de cada componente en el cálculo del ajuste.
                    La suma debe ser igual a 1.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="steelWeight">Acero</Label>
                      <Input
                        id="steelWeight"
                        type="number"
                        step="0.0001"
                        value={coefficients.steelWeight}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setCoefficients({ ...coefficients, steelWeight: isNaN(value) ? 0 : value });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="laborWeight">Mano de Obra</Label>
                      <Input
                        id="laborWeight"
                        type="number"
                        step="0.0001"
                        value={coefficients.laborWeight}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setCoefficients({ ...coefficients, laborWeight: isNaN(value) ? 0 : value });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="concreteWeight">Hormigón</Label>
                      <Input
                        id="concreteWeight"
                        type="number"
                        step="0.0001"
                        value={coefficients.concreteWeight}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setCoefficients({ ...coefficients, concreteWeight: isNaN(value) ? 0 : value });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dieselWeight">Combustible</Label>
                      <Input
                        id="dieselWeight"
                        type="number"
                        step="0.0001"
                        value={coefficients.dieselWeight}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setCoefficients({ ...coefficients, dieselWeight: isNaN(value) ? 0 : value });
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">
                      Suma total: {(coefficients.steelWeight + coefficients.laborWeight + coefficients.concreteWeight + coefficients.dieselWeight).toFixed(4)}
                    </p>
                    {Math.abs((coefficients.steelWeight + coefficients.laborWeight + coefficients.concreteWeight + coefficients.dieselWeight) - 1) > 0.001 && (
                      <p className="text-sm text-red-500 mt-1">
                        La suma debe ser igual a 1
                      </p>
                    )}
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button className="mt-4" onClick={handleCoefficientUpdate}>
                      Guardar Coeficientes
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </CardTransition>
          </TabsContent>
        </Tabs>
      </SectionTransition>

      <MonthlyIndexModal
        open={indexModalOpen}
        onOpenChange={setIndexModalOpen}
        index={selectedIndex}
        onSuccess={fetchIndices}
      />

      <AdjustmentCalculatorModal
        open={calculatorModalOpen}
        onOpenChange={setCalculatorModalOpen}
      />
    </PageTransition>
  );
}
