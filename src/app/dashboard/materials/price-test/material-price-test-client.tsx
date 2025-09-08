'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string;
  name: string;
  currentPrice: number;
  unit: string;
  category: string;
}

interface Piece {
  id: string;
  description: string;
  materials: Array<{
    materialId: string;
    quantity: number;
    scrap: number;
    material: Material;
  }>;
}

interface PriceChangeTest {
  materialId: string;
  originalPrice: number;
  newPrice: number;
  changePercent: number;
  affectedPieces: string[];
  beforeCosts: Record<string, number>;
  afterCosts: Record<string, number>;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export default function MaterialPriceTestClient() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [priceChange, setPriceChange] = useState({
    newPrice: 0,
    changeType: 'increase',
    percentage: 10
  });
  const [testResults, setTestResults] = useState<PriceChangeTest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materialsRes, piecesRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/pieces')
      ]);

      if (materialsRes.ok && piecesRes.ok) {
        const [materialsData, piecesData] = await Promise.all([
          materialsRes.json(),
          piecesRes.json()
        ]);

        setMaterials(materialsData.items || materialsData);
        setPieces(piecesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    }
  };

  const calculateNewPrice = (currentPrice: number, changeType: string, percentage: number) => {
    if (changeType === 'increase') {
      return currentPrice * (1 + percentage / 100);
    } else {
      return currentPrice * (1 - percentage / 100);
    }
  };

  const getAffectedPieces = (materialId: string) => {
    return pieces.filter(piece => 
      piece.materials.some(pm => pm.materialId === materialId)
    );
  };

  const calculatePieceCost = async (pieceId: string) => {
    try {
      const response = await fetch('/api/cost-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pieceId: pieceId,
          quantity: 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.totalCost || 0;
      }
    } catch (error) {
      console.error('Error calculating piece cost:', error);
    }
    return 0;
  };

  const updateMaterialPrice = async (materialId: string, newPrice: number) => {
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPrice: newPrice })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating material price:', error);
      return false;
    }
  };

  const runPriceChangeTest = async () => {
    if (!selectedMaterial) {
      toast.error('Seleccione un material');
      return;
    }

    setLoading(true);
    const material = materials.find(m => m.id === selectedMaterial);
    if (!material) return;

    const newPrice = calculateNewPrice(material.currentPrice, priceChange.changeType, priceChange.percentage);
    const affectedPieces = getAffectedPieces(selectedMaterial);
    
    const test: PriceChangeTest = {
      materialId: selectedMaterial,
      originalPrice: material.currentPrice,
      newPrice: newPrice,
      changePercent: priceChange.changeType === 'increase' ? priceChange.percentage : -priceChange.percentage,
      affectedPieces: affectedPieces.map(p => p.id),
      beforeCosts: {},
      afterCosts: {},
      status: 'running'
    };

    setTestResults(prev => [test, ...prev]);

    try {
      // Calculate costs before price change
      for (const piece of affectedPieces) {
        test.beforeCosts[piece.id] = await calculatePieceCost(piece.id);
      }

      // Update material price
      const updateSuccess = await updateMaterialPrice(selectedMaterial, newPrice);
      if (!updateSuccess) {
        test.status = 'error';
        return;
      }

      // Wait a moment for price propagation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculate costs after price change
      for (const piece of affectedPieces) {
        test.afterCosts[piece.id] = await calculatePieceCost(piece.id);
      }

      test.status = 'completed';
      toast.success('Prueba de cambio de precio completada');

      // Update material in local state
      setMaterials(prev => prev.map(m => 
        m.id === selectedMaterial ? { ...m, currentPrice: newPrice } : m
      ));

    } catch (error) {
      console.error('Error in price change test:', error);
      test.status = 'error';
      toast.error('Error en la prueba');
    } finally {
      setLoading(false);
      setTestResults(prev => prev.map(t => 
        t.materialId === test.materialId && t.status === 'running' ? test : t
      ));
    }
  };

  const revertPriceChange = async (test: PriceChangeTest) => {
    setLoading(true);
    try {
      const success = await updateMaterialPrice(test.materialId, test.originalPrice);
      if (success) {
        setMaterials(prev => prev.map(m => 
          m.id === test.materialId ? { ...m, currentPrice: test.originalPrice } : m
        ));
        toast.success('Precio revertido');
      } else {
        toast.error('Error al revertir precio');
      }
    } catch (error) {
      console.error('Error reverting price:', error);
      toast.error('Error al revertir precio');
    } finally {
      setLoading(false);
    }
  };

  const runBatchPriceTest = async () => {
    if (materials.length === 0) {
      toast.error('No hay materiales para probar');
      return;
    }

    setLoading(true);
    toast.info('Iniciando prueba masiva de precios...');

    try {
      // Test multiple materials with different price changes
      const testMaterials = materials.slice(0, 3); // Test first 3 materials
      const priceChanges = [5, 10, -3]; // Different percentage changes

      for (let i = 0; i < testMaterials.length; i++) {
        const material = testMaterials[i];
        const changePercent = priceChanges[i];
        const newPrice = material.currentPrice * (1 + changePercent / 100);
        
        // Run individual test
        setSelectedMaterial(material.id);
        setPriceChange({
          newPrice: newPrice,
          changeType: changePercent > 0 ? 'increase' : 'decrease',
          percentage: Math.abs(changePercent)
        });

        await runPriceChangeTest();
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast.success('Prueba masiva completada');
    } catch (error) {
      console.error('Error in batch test:', error);
      toast.error('Error en prueba masiva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Validación de Precios Dinámicos</h1>
        <Button onClick={runBatchPriceTest} disabled={loading || materials.length === 0}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Prueba Masiva
        </Button>
      </div>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList>
          <TabsTrigger value="single">Prueba Individual</TabsTrigger>
          <TabsTrigger value="results">Resultados de Pruebas</TabsTrigger>
          <TabsTrigger value="analysis">Análisis de Impacto</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Cambio de Precio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="material">Material</Label>
                  <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} (${material.currentPrice}/{material.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="changeType">Tipo de Cambio</Label>
                  <Select 
                    value={priceChange.changeType} 
                    onValueChange={(value) => setPriceChange({ ...priceChange, changeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Aumento</SelectItem>
                      <SelectItem value="decrease">Disminución</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="percentage">Porcentaje de Cambio (%)</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={priceChange.percentage}
                    onChange={(e) => setPriceChange({ 
                      ...priceChange, 
                      percentage: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>

                {selectedMaterial && (
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="text-sm font-medium">Vista Previa:</p>
                    {(() => {
                      const material = materials.find(m => m.id === selectedMaterial);
                      if (!material) return null;
                      const newPrice = calculateNewPrice(material.currentPrice, priceChange.changeType, priceChange.percentage);
                      const affectedPieces = getAffectedPieces(selectedMaterial);
                      
                      return (
                        <div className="mt-2 space-y-1 text-sm">
                          <p>Precio actual: ${material.currentPrice.toFixed(2)}</p>
                          <p>Precio nuevo: ${newPrice.toFixed(2)}</p>
                          <p>Piezas afectadas: {affectedPieces.length}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <Button 
                  onClick={runPriceChangeTest} 
                  disabled={loading || !selectedMaterial}
                  className="w-full"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Ejecutar Prueba
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materiales Disponibles ({materials.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {materials.map((material) => (
                    <div key={material.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{material.name}</p>
                        <p className="text-xs text-muted-foreground">{material.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${material.currentPrice.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">por {material.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pruebas ({testResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">No hay pruebas ejecutadas</p>
              ) : (
                <div className="space-y-4">
                  {testResults.map((test, index) => {
                    const material = materials.find(m => m.id === test.materialId);
                    return (
                      <div key={index} className="border rounded p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">{material?.name || 'Material'}</h3>
                            <p className="text-sm text-muted-foreground">
                              ${test.originalPrice.toFixed(2)} → ${test.newPrice.toFixed(2)} 
                              ({test.changePercent > 0 ? '+' : ''}{test.changePercent.toFixed(1)}%)
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {test.changePercent > 0 ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${
                              test.status === 'completed' ? 'bg-green-100 text-green-800' :
                              test.status === 'error' ? 'bg-red-100 text-red-800' :
                              test.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {test.status === 'completed' ? 'Completado' :
                               test.status === 'error' ? 'Error' :
                               test.status === 'running' ? 'Ejecutando' : 'Pendiente'}
                            </span>
                          </div>
                        </div>

                        {test.status === 'completed' && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              Impacto en {test.affectedPieces.length} pieza(s):
                            </p>
                            {test.affectedPieces.map(pieceId => {
                              const piece = pieces.find(p => p.id === pieceId);
                              const beforeCost = test.beforeCosts[pieceId] || 0;
                              const afterCost = test.afterCosts[pieceId] || 0;
                              const costChange = afterCost - beforeCost;
                              const percentChange = beforeCost > 0 ? (costChange / beforeCost * 100) : 0;

                              return (
                                <div key={pieceId} className="text-xs flex justify-between p-2 bg-gray-50 rounded">
                                  <span>{piece?.description || 'Pieza'}</span>
                                  <span className={costChange >= 0 ? 'text-red-600' : 'text-green-600'}>
                                    ${beforeCost.toFixed(2)} → ${afterCost.toFixed(2)}
                                    ({costChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                                  </span>
                                </div>
                              );
                            })}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => revertPriceChange(test)}
                              disabled={loading}
                            >
                              Revertir Cambio
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Sensibilidad</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-muted-foreground">Execute pruebas para ver análisis</p>
                ) : (
                  <div className="space-y-3">
                    {testResults.filter(t => t.status === 'completed').map((test, index) => {
                      const totalImpact = Object.values(test.afterCosts).reduce((sum, cost, i) => {
                        const beforeCost = Object.values(test.beforeCosts)[i] || 0;
                        return sum + Math.abs(cost - beforeCost);
                      }, 0);

                      return (
                        <div key={index} className="p-3 border rounded">
                          <p className="font-medium text-sm">
                            Cambio {test.changePercent.toFixed(1)}% en {materials.find(m => m.id === test.materialId)?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Impacto total: ${totalImpact.toFixed(2)} en {test.affectedPieces.length} pieza(s)
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Monitorear precios de materiales críticos frecuentemente</p>
                  <p>• Establecer alertas para cambios de precio superiores al 5%</p>
                  <p>• Revisar escalas de ajuste cuando cambien los costos base</p>
                  <p>• Considerar contratos a precio fijo para materiales volátiles</p>
                  <p>• Actualizar presupuestos existentes tras cambios significativos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}