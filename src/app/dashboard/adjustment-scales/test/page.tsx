'use client';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, CheckCircle, XCircle, Calculator } from 'lucide-react';

interface AdjustmentScale {
  id: string;
  familyId: string;
  quantityFrom: number;
  quantityTo: number;
  discountGeneral: number;
  discountSpecial: number;
  adjustmentGeneral: number;
  adjustmentSpecial: number;
  effectiveDate: string;
  expirationDate?: string;
  family: {
    description: string;
  };
}

interface TestScenario {
  name: string;
  pieceId?: string;
  quantity: number;
  expectedDiscountRange: [number, number];
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
}

export default function AdjustmentScalesTestPage() {
  const [scales, setScales] = useState<AdjustmentScale[]>([]);
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([
    { name: 'Cantidad baja (1-10 piezas)', quantity: 5, expectedDiscountRange: [0, 5], status: 'pending' },
    { name: 'Cantidad media (11-50 piezas)', quantity: 25, expectedDiscountRange: [2, 8], status: 'pending' },
    { name: 'Cantidad alta (51-100 piezas)', quantity: 75, expectedDiscountRange: [5, 12], status: 'pending' },
    { name: 'Cantidad muy alta (>100 piezas)', quantity: 150, expectedDiscountRange: [8, 15], status: 'pending' }
  ]);

  const [manualTest, setManualTest] = useState({
    quantity: 10,
    pieceId: '',
    familyId: ''
  });

  const [manualResult, setManualResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdjustmentScales();
  }, []);

  const loadAdjustmentScales = async () => {
    try {
      const response = await fetch('/api/adjustment-scales');
      if (response.ok) {
        const data = await response.json();
        setScales(data);
      }
    } catch (error) {
      console.error('Error loading adjustment scales:', error);
    }
  };

  const createTestScales = async () => {
    setLoading(true);
    try {
      // Get families first
      const familiesRes = await fetch('/api/piece-families');
      const families = await familiesRes.json();
      
      if (families.length === 0) {
        alert('No hay familias de piezas. Cree al menos una familia primero.');
        return;
      }

      const testScales = [
        {
          familyId: families[0].id,
          quantityFrom: 1,
          quantityTo: 10,
          discountGeneral: 0,
          discountSpecial: 2,
          adjustmentGeneral: 0,
          adjustmentSpecial: 0,
          effectiveDate: new Date().toISOString(),
          isActive: true
        },
        {
          familyId: families[0].id,
          quantityFrom: 11,
          quantityTo: 50,
          discountGeneral: 3,
          discountSpecial: 6,
          adjustmentGeneral: 0,
          adjustmentSpecial: 0,
          effectiveDate: new Date().toISOString(),
          isActive: true
        },
        {
          familyId: families[0].id,
          quantityFrom: 51,
          quantityTo: 100,
          discountGeneral: 7,
          discountSpecial: 12,
          adjustmentGeneral: 0,
          adjustmentSpecial: 0,
          effectiveDate: new Date().toISOString(),
          isActive: true
        },
        {
          familyId: families[0].id,
          quantityFrom: 101,
          quantityTo: 999999,
          discountGeneral: 12,
          discountSpecial: 18,
          adjustmentGeneral: 0,
          adjustmentSpecial: 0,
          effectiveDate: new Date().toISOString(),
          isActive: true
        }
      ];

      for (const scale of testScales) {
        await fetch('/api/adjustment-scales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scale)
        });
      }

      await loadAdjustmentScales();
      alert('Escalas de prueba creadas exitosamente');
    } catch (error) {
      console.error('Error creating test scales:', error);
      alert('Error al crear escalas de prueba');
    } finally {
      setLoading(false);
    }
  };

  const runScenarioTests = async () => {
    // Get a sample piece for testing
    const piecesRes = await fetch('/api/pieces');
    const pieces = await piecesRes.json();
    
    if (!pieces.length) {
      alert('No hay piezas para probar. Cree al menos una pieza primero.');
      return;
    }

    const samplePiece = pieces[0];

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      
      // Update status to running
      setTestScenarios(prev => prev.map((s, index) => 
        index === i ? { ...s, status: 'running', pieceId: samplePiece.id } : s
      ));

      try {
        const response = await fetch('/api/cost-calculation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pieceId: samplePiece.id,
            quantity: scenario.quantity
          })
        });

        if (response.ok) {
          const result = await response.json();
          const discountApplied = result.breakdown?.adjustmentScale || 0;
          const discountPercent = Math.abs(discountApplied / result.baseCost.total * 100);
          
          const withinRange = discountPercent >= scenario.expectedDiscountRange[0] && 
                             discountPercent <= scenario.expectedDiscountRange[1];

          setTestScenarios(prev => prev.map((s, index) => 
            index === i ? { 
              ...s, 
              status: withinRange ? 'success' : 'error',
              result: {
                ...result,
                discountPercent: discountPercent.toFixed(2),
                withinRange
              }
            } : s
          ));
        } else {
          setTestScenarios(prev => prev.map((s, index) => 
            index === i ? { ...s, status: 'error', result: { error: 'API Error' } } : s
          ));
        }
      } catch (error) {
        console.error('Error in automated tests:', error);
        setTestScenarios(prev => prev.map((s, index) => 
          index === i ? { ...s, status: 'error', result: { error: error instanceof Error ? error.message : String(error) } } : s
        ));
      }

      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const runManualTest = async () => {
    if (!manualTest.quantity || !manualTest.pieceId) {
      alert('Ingrese todos los datos requeridos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cost-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pieceId: manualTest.pieceId,
          quantity: manualTest.quantity
        })
      });

      if (response.ok) {
        const result = await response.json();
        setManualResult(result);
      } else {
        alert('Error en el cálculo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error en la prueba manual');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pruebas de Escalas de Ajuste</h1>
        <Button onClick={createTestScales} disabled={loading}>
          Crear Escalas de Prueba
        </Button>
      </div>

      <div className="w-full">
        <div className="grid w-full grid-cols-3 mb-4">
          <button className="p-2 border rounded">Pruebas Automatizadas</button>
          <button className="p-2 border rounded">Escenarios de Prueba</button>
          <button className="p-2 border rounded">Prueba Manual</button>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Pruebas Automatizadas</h3>
            </CardHeader>
            <CardContent>
              {scales.length === 0 ? (
                <p className="text-muted-foreground">No hay escalas configuradas. Use el botón "Crear Escalas de Prueba".</p>
              ) : (
                <div className="space-y-3">
                  {scales.map((scale) => (
                    <div key={scale.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{scale.family.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {scale.quantityFrom}-{scale.quantityTo === 999999 ? '∞' : scale.quantityTo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          <span className="text-green-600">Desc: {scale.discountGeneral}%/{scale.discountSpecial}%</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-blue-600">Ajust: {scale.adjustmentGeneral}%/{scale.adjustmentSpecial}%</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Escenarios de Prueba Automática</h3>
                <Button onClick={runScenarioTests} disabled={scales.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Ejecutar Pruebas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testScenarios.map((scenario, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(scenario.status)}
                      <div>
                        <p className="font-medium">{scenario.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {scenario.quantity} | Descuento esperado: {scenario.expectedDiscountRange[0]}%-{scenario.expectedDiscountRange[1]}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {scenario.result && (
                        <div className="text-sm">
                          {scenario.result.discountPercent && (
                            <p className={scenario.result.withinRange ? 'text-green-600' : 'text-red-600'}>
                              Descuento aplicado: {scenario.result.discountPercent}%
                            </p>
                          )}
                          {scenario.result.grandTotal && (
                            <p className="text-muted-foreground">
                              Total: ${scenario.result.grandTotal.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Prueba Manual</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pieceId">ID de Pieza</Label>
                <Input
                  id="pieceId"
                  value={manualTest.pieceId}
                  onChange={(e) => setManualTest({ ...manualTest, pieceId: e.target.value })}
                  placeholder="Ingrese ID de pieza"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={manualTest.quantity}
                  onChange={(e) => setManualTest({ ...manualTest, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <Button onClick={runManualTest} disabled={loading} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular
              </Button>
            </CardContent>
          </Card>

          {manualResult && (
            <Card className="mt-4">
              <CardHeader>
                <h3 className="text-lg font-semibold">Resultado del Cálculo</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Costo Base:</span>
                    <span>${(manualResult as any)?.baseCost?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <p><strong>Desglose:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Material: ${(manualResult as any)?.breakdown?.materialCost?.toFixed(2) || 'N/A'}</li>
                  </ul>
                  <p><strong>Costo Total:</strong> ${(manualResult as any)?.totalCost?.toFixed(2) || 'N/A'}</p>
                  <p><strong>Costo Flete:</strong> ${(manualResult as any)?.freightCost?.toFixed(2) || 'N/A'}</p>
                  <p><strong>Total General:</strong> ${(manualResult as any)?.grandTotal?.toFixed(2) || 'N/A'}</p>
                  <p><strong>Precio Unitario:</strong> ${(manualResult as any)?.unitPrice?.toFixed(2) || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
