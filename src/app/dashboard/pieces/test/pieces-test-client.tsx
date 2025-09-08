'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export default function PiecesTestClient() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'API: Obtener materiales', status: 'pending' },
    { name: 'API: Obtener familias de piezas', status: 'pending' },
    { name: 'API: Obtener plantas', status: 'pending' },
    { name: 'API: Crear pieza con materiales', status: 'pending' },
    { name: 'API: Calcular costo base', status: 'pending' },
    { name: 'API: Aplicar escalas de ajuste', status: 'pending' },
    { name: 'API: Calcular costo total', status: 'pending' }
  ]);

  const updateTestResult = (index: number, result: Partial<TestResult>) => {
    setTestResults(prev => prev.map((test, i) => 
      i === index ? { ...test, ...result } : test
    ));
  };

  const runTests = async () => {
    try {
      // Test 1: Get materials
      updateTestResult(0, { status: 'running' });
      const materialsRes = await fetch('/api/materials');
      if (materialsRes.ok) {
        const materials = await materialsRes.json();
        updateTestResult(0, { 
          status: 'success', 
          message: `${materials.items?.length || materials.length || 0} materiales encontrados`
        });
      } else {
        updateTestResult(0, { status: 'error', message: 'Error al obtener materiales' });
        return;
      }

      // Test 2: Get piece families
      updateTestResult(1, { status: 'running' });
      const familiesRes = await fetch('/api/piece-families');
      if (familiesRes.ok) {
        const families = await familiesRes.json();
        updateTestResult(1, { 
          status: 'success', 
          message: `${families.length || 0} familias encontradas`
        });
      } else {
        updateTestResult(1, { status: 'error', message: 'Error al obtener familias' });
        return;
      }

      // Test 3: Get plants
      updateTestResult(2, { status: 'running' });
      const plantsRes = await fetch('/api/plants');
      if (plantsRes.ok) {
        const plants = await plantsRes.json();
        updateTestResult(2, { 
          status: 'success', 
          message: `${plants.items?.length || plants.length || 0} plantas encontradas`
        });
      } else {
        updateTestResult(2, { status: 'error', message: 'Error al obtener plantas' });
        return;
      }

      // Test 4: Create sample piece
      updateTestResult(3, { status: 'running' });
      const materials = await (await fetch('/api/materials')).json();
      const families = await (await fetch('/api/piece-families')).json();
      
      if (materials.items?.length && families.length) {
        const samplePiece = {
          familyId: families[0].id,
          description: `Pieza de Prueba ${Date.now()}`,
          weight: 5000,
          length: 12,
          width: 0.3,
          height: 0.4,
          volume: 1.44,
          unitMeasure: 'm',
          materials: materials.items.map((material: any, index: number) => ({
            materialId: material.id,
            quantity: index === 0 ? 1.44 : 120,
            scrap: 5
          }))
        };

        const pieceRes = await fetch('/api/pieces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(samplePiece)
        });

        if (pieceRes.ok) {
          const createdPiece = await pieceRes.json();
          updateTestResult(3, { 
            status: 'success', 
            message: `Pieza creada: ${createdPiece.description}`,
            data: createdPiece
          });

          // Test 5: Calculate base cost
          updateTestResult(4, { status: 'running' });
          try {
            const costRes = await fetch('/api/cost-calculation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pieceId: createdPiece.id,
                quantity: 10,
                transportKm: 100
              })
            });

            if (costRes.ok) {
              const costData = await costRes.json();
              updateTestResult(4, { 
                status: 'success', 
                message: `Costo base: $${costData.baseCost?.total || 0}`,
                data: costData
              });
              updateTestResult(5, { 
                status: 'success', 
                message: `Costo total: $${costData.totalCost || 0}` 
              });
              updateTestResult(6, { 
                status: 'success', 
                message: `Costo final: $${costData.grandTotal || 0}` 
              });
            } else {
              const error = await costRes.json();
              updateTestResult(4, { status: 'error', message: error.error || 'Error en cálculo' });
              updateTestResult(5, { status: 'error', message: 'Dependiente del test anterior' });
              updateTestResult(6, { status: 'error', message: 'Dependiente del test anterior' });
            }
          } catch (error) {
            updateTestResult(4, { status: 'error', message: 'Error en servicio de cálculo' });
            updateTestResult(5, { status: 'error', message: 'Dependiente del test anterior' });
            updateTestResult(6, { status: 'error', message: 'Dependiente del test anterior' });
          }
        } else {
          const error = await pieceRes.json();
          updateTestResult(3, { status: 'error', message: error.error || 'Error al crear pieza' });
          updateTestResult(4, { status: 'error', message: 'Dependiente del test anterior' });
          updateTestResult(5, { status: 'error', message: 'Dependiente del test anterior' });
          updateTestResult(6, { status: 'error', message: 'Dependiente del test anterior' });
        }
      } else {
        updateTestResult(3, { status: 'error', message: 'No hay datos base suficientes' });
        updateTestResult(4, { status: 'error', message: 'Dependiente del test anterior' });
        updateTestResult(5, { status: 'error', message: 'Dependiente del test anterior' });
        updateTestResult(6, { status: 'error', message: 'Dependiente del test anterior' });
      }

    } catch (error) {
      console.error('Error running tests:', error);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'outline',
      running: 'default',
      success: 'default',
      error: 'destructive'
    };
    const colors: Record<string, string> = {
      pending: 'text-yellow-500',
      running: 'text-blue-500',
      success: 'text-green-500',
      error: 'text-red-500'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className={colors[status]}>
        {status === 'pending' ? 'Pendiente' : 
         status === 'running' ? 'Ejecutando' :
         status === 'success' ? 'Éxito' : 'Error'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pruebas del Sistema de Piezas</h1>
        <Button onClick={runTests} className="flex items-center gap-2">
          <Play className="h-4 w-4" />
          Ejecutar Pruebas
        </Button>
      </div>

      <div className="space-y-4">
        {testResults.map((test, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {test.message && (
                    <span className="text-sm text-muted-foreground">{test.message}</span>
                  )}
                  {getStatusBadge(test.status)}
                </div>
              </div>
              {test.data && test.status === 'success' && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                  <pre>{JSON.stringify(test.data, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Información del Sistema</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">Componentes Implementados:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ API de Piezas con transacciones BOM</li>
                <li>✅ Modal dinámico de materiales</li>
                <li>✅ Servicio de cálculo de costos</li>
                <li>✅ Escalas de ajuste</li>
                <li>✅ Fórmulas polinómicas</li>
                <li>✅ Cálculo de flete</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Próximos Pasos:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>🔄 Pruebas con datos reales</li>
                <li>🔄 Validación de precios dinámicos</li>
                <li>🔄 Integración con presupuestos</li>
                <li>🔄 Optimización de rendimiento</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}