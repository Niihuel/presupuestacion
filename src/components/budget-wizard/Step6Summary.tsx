'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import axios from 'axios';

interface Step6SummaryProps {
  data: any;
  onUpdate: (data: any) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function Step6Summary({ data, onUpdate, onComplete, onBack }: Step6SummaryProps) {
  const [loading, setLoading] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState(data.summary?.paymentTerms || 'DAYS_30');
  const [currency, setCurrency] = useState(data.summary?.currency || 'ARS');
  const [validityDays, setValidityDays] = useState(data.summary?.validityDays || 30);
  const [suggestedMargin, setSuggestedMargin] = useState(25);
  const [internalNotes, setInternalNotes] = useState(data.summary?.internalNotes || '');
  const [clientNotes, setClientNotes] = useState(data.summary?.clientNotes || '');
  
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [priceComparison, setPriceComparison] = useState<any>(null);
  const [detailedBreakdown, setDetailedBreakdown] = useState<any>(null);

  useEffect(() => {
    generateSummary();
  }, [paymentTerms, suggestedMargin, validityDays]);

  const generateSummary = async () => {
    setLoading(true);

    try {
      // Usar costos reales ya calculados en Step2Plant con sistema PRETENSA
      const materialsCost = data.pieces?.reduce((sum: number, item: any) => {
        return sum + (item.totalCost || 0);
      }, 0) || 0;
      
      // Calcular flete total si hay distancia
      let freightCost = 0;
      if (data.distance?.totalKm && data.pieces?.length > 0) {
        try {
          const freightResponse = await axios.post('/api/cost-calculation', {
            pieceId: data.pieces[0].pieceId,
            quantity: 1,
            transportKm: data.distance.totalKm,
            pieces: data.pieces.map((p: any) => ({
              id: p.pieceId,
              weight: p.piece?.weight || 0,
              length: p.piece?.length || 0,
              quantity: p.quantity
            }))
          });
          freightCost = freightResponse.data?.freightCost?.totalCost || 0;
        } catch (error) {
          console.error('Error calculating freight:', error);
          freightCost = data.freight?.totalFreightCost || 0;
        }
      }
      
      const montageCost = data.additionals?.totalMontageCost || 0;
      const additionalsCost = data.additionals?.totalAdditionalsCost || 0;

      // Crear desglose detallado PRETENSA
      const breakdown = {
        pieces: data.pieces?.map((item: any) => ({
          name: item.piece?.name || item.piece?.description,
          quantity: item.quantity,
          unitCost: item.unitCost || 0,
          totalCost: item.totalCost || 0,
          calculation: item.calculationBreakdown
        })) || [],
        totalMaterialsCost: materialsCost,
        freightCost,
        montageCost,
        additionalsCost
      };
      setDetailedBreakdown(breakdown);

      const response = await axios.post('/api/budget/summary', {
        materialsCost,
        freightCost,
        montageCost,
        additionalsCost,
        paymentTerms,
        currency,
        validityDays,
        suggestedMargin,
        clientId: data.clientId,
        projectId: data.projectId,
        plantId: data.plantId,
        pieces: data.pieces,
        distance: data.distance,
        freight: data.freight,
        additionals: data.additionals
      });

      const result = response.data;
      setSummary(result.summary);
      setAlerts(result.alerts || []);
      setPriceComparison(result.priceComparison);

      // Actualizar datos
      onUpdate({
        ...data,
        summary: {
          ...result.summary,
          internalNotes,
          clientNotes,
          paymentTerms,
          currency,
          validityDays,
          suggestedMargin
        }
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      setAlerts([{ type: 'error', message: 'Error al generar resumen' }]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const getMarginColor = (margin: number) => {
    if (margin < 10) return 'text-red-600';
    if (margin < 15) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPaymentAdjustmentLabel = (terms: string) => {
    switch(terms) {
      case 'CASH': return '-3% descuento';
      case 'DAYS_30': return 'Precio lista';
      case 'DAYS_60': return '+2% recargo';
      case 'DAYS_90': return '+5% recargo';
      default: return '';
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Guardar presupuesto completo
      await onComplete();
    } catch (error) {
      console.error('Error saving budget:', error);
      setAlerts([{ type: 'error', message: 'Error al guardar presupuesto' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Condiciones Comerciales */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Condiciones Comerciales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Forma de Pago</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">
                  <div className="flex items-center justify-between w-full">
                    <span>Contado</span>
                    <Badge variant="secondary" className="ml-2">-3%</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="DAYS_30">30 días</SelectItem>
                <SelectItem value="DAYS_60">
                  <div className="flex items-center justify-between w-full">
                    <span>60 días</span>
                    <Badge variant="secondary" className="ml-2">+2%</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="DAYS_90">
                  <div className="flex items-center justify-between w-full">
                    <span>90 días</span>
                    <Badge variant="secondary" className="ml-2">+5%</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-1">{getPaymentAdjustmentLabel(paymentTerms)}</p>
          </div>

          <div>
            <Label>Moneda</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                <SelectItem value="USD">Dólares (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Validez de la Oferta</Label>
            <Select value={validityDays.toString()} onValueChange={(v) => setValidityDays(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="45">45 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <Label>Margen de Ganancia Sugerido: {suggestedMargin}%</Label>
          <Slider
            value={[suggestedMargin]}
            onValueChange={([value]) => setSuggestedMargin(value)}
            min={10}
            max={50}
            step={5}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>10%</span>
            <span>25% (Estándar)</span>
            <span>50%</span>
          </div>
        </div>
      </Card>

      {/* Resumen de Costos */}
      {summary && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen de Costos
          </h3>

          <div className="space-y-4">
            {/* Desglose detallado PRETENSA */}
            {detailedBreakdown && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Cálculo Sistema PRETENSA (3 Capas)
                </h4>
                
                {detailedBreakdown.pieces.map((piece: any, index: number) => (
                  <div key={index} className="mb-3 p-3 bg-white rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">{piece.name}</span>
                        <span className="text-sm text-gray-600 ml-2">x{piece.quantity}</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(piece.totalCost)}
                      </span>
                    </div>
                    
                    {piece.calculation && (
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>• Capa 1 (Base + BOM):</span>
                          <span>{formatCurrency(piece.calculation.layer1Cost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Capa 2 (Ajustes -15% +311.365%):</span>
                          <span>{formatCurrency(piece.calculation.layer2Cost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Capa 3 (Polinómica {((piece.calculation.polynomialFactor || 1) * 100 - 100).toFixed(2)}%):</span>
                          <span>{formatCurrency(piece.calculation.finalCostWithPolynomial || 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Piezas (Sistema PRETENSA):</span>
              <span className="text-right font-medium">{formatCurrency(detailedBreakdown?.totalMaterialsCost || 0)}</span>
              
              <span className="text-gray-600">Flete optimizado:</span>
              <span className="text-right font-medium">{formatCurrency(detailedBreakdown?.freightCost || 0)}</span>
              
              <span className="text-gray-600">Montaje:</span>
              <span className="text-right font-medium">{formatCurrency(detailedBreakdown?.montageCost || 0)}</span>
              
              <span className="text-gray-600">Adicionales:</span>
              <span className="text-right font-medium">{formatCurrency(detailedBreakdown?.additionalsCost || 0)}</span>
            </div>

            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Costo Base:</span>
                <span className="text-right font-semibold">{formatCurrency(summary.baseCost)}</span>
                
                <span className="text-gray-600">
                  Margen ({summary.margin?.toFixed(1)}%):
                </span>
                <span className={`text-right font-semibold ${getMarginColor(summary.margin)}`}>
                  {formatCurrency(summary.marginAmount)}
                </span>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-right font-semibold">{formatCurrency(summary.subtotalWithMargin)}</span>
                
                {summary.paymentAdjustmentAmount !== 0 && (
                  <>
                    <span className="text-gray-600">
                      Ajuste {paymentTerms === 'CASH' ? 'Descuento' : 'Recargo'}:
                    </span>
                    <span className={`text-right font-semibold ${summary.paymentAdjustmentAmount < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(summary.paymentAdjustmentAmount))}
                    </span>
                  </>
                )}
                
                <span className="text-gray-600">IVA (21%):</span>
                <span className="text-right font-semibold">{formatCurrency(summary.tax)}</span>
              </div>
            </div>

            <div className="border-t pt-3 bg-green-50 -mx-6 px-6 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-lg font-bold">TOTAL FINAL:</span>
                <span className="text-right text-xl font-bold text-green-600">
                  {formatCurrency(summary.finalTotal)}
                </span>
              </div>
              {currency === 'USD' && (
                <p className="text-xs text-gray-600 text-right mt-1">
                  Tipo de cambio: 1 USD = {summary.exchangeRate} ARS
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Comparación de Precios */}
      {priceComparison && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {priceComparison.difference > 0 ? (
              <TrendingUp className="h-5 w-5 text-red-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-500" />
            )}
            Comparación Histórica
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Precio promedio histórico</p>
              <p className="text-xl font-semibold">{formatCurrency(priceComparison.averagePrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Diferencia</p>
              <p className={`text-xl font-bold ${priceComparison.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {priceComparison.difference > 0 ? '+' : ''}{priceComparison.difference.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Notas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notas y Observaciones</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Notas Internas (no se incluyen en el PDF)</Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Observaciones para uso interno..."
              rows={3}
            />
          </div>
          
          <div>
            <Label>Notas para el Cliente</Label>
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Condiciones especiales, aclaraciones..."
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <div className="flex items-start gap-2">
                {alert.requiresApproval ? (
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{alert.message}</p>
                  {alert.requiresApproval && (
                    <p className="text-sm mt-1">Este presupuesto requiere aprobación antes de enviarse al cliente.</p>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Acciones */}
      <Card className="p-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Vencimiento</p>
              <p className="font-semibold">
                {new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>
              Anterior
            </Button>
            <Button variant="outline" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Guardar Borrador
            </Button>
            <Button 
              onClick={handleComplete} 
              disabled={loading || alerts.some(a => a.requiresApproval)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? 'Generando...' : 'Generar Presupuesto'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
