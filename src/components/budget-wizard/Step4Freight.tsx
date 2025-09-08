'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truck, Package, AlertTriangle, Info, DollarSign } from 'lucide-react';
import axios from 'axios';

interface Step4FreightProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

interface FreightTruck {
  truckNumber: number;
  pieces: any[];
  realWeight: number;
  falseWeight: number;
  maxCapacity: number;
  pieceCount: number;
  over12m: boolean;
  requiresEscort: boolean;
  cost: number;
}

export default function Step4Freight({ data, onUpdate, onNext, onBack }: Step4FreightProps) {
  const [loading, setLoading] = useState(false);
  const [trucks, setTrucks] = useState<FreightTruck[]>([]);
  const [totalRealWeight, setTotalRealWeight] = useState(0);
  const [totalFalseWeight, setTotalFalseWeight] = useState(0);
  const [totalFreightCost, setTotalFreightCost] = useState(0);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any>({});

  useEffect(() => {
    if (data.distance?.billedDistance && data.pieces?.length > 0) {
      calculateFreight();
    }
  }, []);

  const calculateFreight = async () => {
    setLoading(true);
    setWarnings([]);

    try {
      // Preparar piezas con sus datos completos
      const piecesWithDetails = data.pieces.map((item: any) => ({
        id: item.pieceId,
        name: item.piece?.name || `Pieza ${item.pieceId}`,
        weight: item.piece?.weight || 10,
        length: item.piece?.length || 6,
        quantity: item.quantity,
        individualTransport: item.piece?.individualTransport || false,
        requiresEscort: item.piece?.requiresEscort || false,
        piecesPerTruck: item.piece?.piecesPerTruck || 10
      }));

      const response = await axios.post('/api/budget/freight', {
        pieces: piecesWithDetails,
        billedDistance: data.distance.billedDistance,
        optimizationMethod: 'binpacking'
      });

      const result = response.data;
      setTrucks(result.trucks);
      setTotalRealWeight(result.totalRealWeight);
      setTotalFalseWeight(result.totalFalseWeight);
      setTotalFreightCost(result.totalFreightCost);
      setWarnings(result.warnings || []);
      setBreakdown(result.breakdown || {});

      // Actualizar datos
      onUpdate({
        ...data,
        freight: {
          trucks: result.trucks,
          totalRealWeight: result.totalRealWeight,
          totalFalseWeight: result.totalFalseWeight,
          totalFreightCost: result.totalFreightCost,
          trucksRequired: result.trucksRequired
        }
      });
    } catch (error) {
      console.error('Error calculating freight:', error);
      setWarnings([{ type: 'error', message: 'Error al calcular flete' }]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 85) return 'text-green-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Optimización de Carga
          </h3>
          <Button 
            onClick={calculateFreight} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Calculando...' : 'Recalcular'}
          </Button>
        </div>

        {totalRealWeight > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Camiones</p>
              <p className="text-2xl font-bold text-blue-600">{trucks.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Ton. Reales</p>
              <p className="text-2xl font-bold text-green-600">{totalRealWeight.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Ton. Falsas</p>
              <p className="text-2xl font-bold text-red-600">{totalFalseWeight.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totalFreightCost)}</p>
            </div>
          </div>
        )}

        {totalFalseWeight > 0 && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <p className="font-semibold">Toneladas Falsas Detectadas</p>
              <p className="text-sm">
                Se facturarán {totalFalseWeight.toFixed(2)} toneladas adicionales para alcanzar el mínimo de carga.
                Las toneladas falsas aparecen en <span className="text-red-600 font-semibold">ROJO</span>.
              </p>
            </div>
          </Alert>
        )}
      </Card>

      {trucks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Distribución por Camión
          </h3>

          <div className="space-y-4">
            {trucks.map((truck) => {
              const utilization = (truck.realWeight / truck.maxCapacity) * 100;
              
              return (
                <div key={truck.truckNumber} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 px-3 py-1 rounded-full">
                        <span className="font-semibold">Camión #{truck.truckNumber}</span>
                      </div>
                      {truck.over12m && (
                        <Badge variant="secondary">+12m</Badge>
                      )}
                      {truck.requiresEscort && (
                        <Badge variant="destructive">Escolta</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(truck.cost)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Piezas ({truck.pieceCount})</p>
                      <div className="flex flex-wrap gap-1">
                        {truck.pieces.map((piece, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {piece.name} x{piece.quantity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Capacidad Utilizada</p>
                      <div className="flex items-center gap-2">
                        <Progress value={utilization} className="flex-1" />
                        <span className={`text-sm font-semibold ${getUtilizationColor(utilization)}`}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>
                          Real: <span className="font-semibold">{truck.realWeight.toFixed(2)}t</span>
                        </span>
                        {truck.falseWeight > 0 && (
                          <span className="text-red-600">
                            Falsas: <span className="font-semibold">{truck.falseWeight.toFixed(2)}t</span>
                          </span>
                        )}
                        <span className="text-gray-500">
                          Máx: {truck.maxCapacity}t
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {breakdown && Object.keys(breakdown).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Resumen de Optimización
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Individuales</p>
              <p className="text-xl font-semibold">{breakdown.individualTrucks || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Agrupados</p>
              <p className="text-xl font-semibold">{breakdown.groupedTrucks || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Con Escolta</p>
              <p className="text-xl font-semibold">{breakdown.escortRequired || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Piezas +12m</p>
              <p className="text-xl font-semibold">{breakdown.over12mTrucks || 0}</p>
            </div>
          </div>
        </Card>
      )}

      {warnings.map((warning, index) => (
        <Alert key={index} variant={warning.type === 'error' ? 'destructive' : 'default'}>
          {warning.message}
        </Alert>
      ))}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button onClick={onNext} disabled={!totalFreightCost}>
          Siguiente: Adicionales y Montaje
        </Button>
      </div>
    </div>
  );
}
