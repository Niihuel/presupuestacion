'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: any;
}

export function PriceHistoryModal({ open, onOpenChange, material }: PriceHistoryModalProps) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && material) {
      fetchHistory();
    }
  }, [open, material]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/materials/${material.id}`);
      setHistory(response.data.priceHistory || []);
    } catch (error) {
      toast.error('No se pudo cargar el historial de precios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de Precios - {material?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay historial de precios disponible
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 font-semibold text-sm text-gray-600 pb-2 border-b">
                <div>Fecha</div>
                <div>Precio</div>
                <div>Cambio</div>
                <div>Motivo</div>
                <div>Creado por</div>
              </div>
              {history.map((record: any, index: number) => (
                <div key={record.id} className="grid grid-cols-5 gap-4 py-2 border-b">
                  <div className="text-sm">
                    {format(new Date(record.effectiveDate), 'dd/MM/yyyy', { locale: es })}
                  </div>
                  <div className="font-medium">
                    {formatCurrency(record.price)}
                  </div>
                  <div className="flex items-center gap-1">
                    {record.changePercent !== null && record.changePercent !== 0 && (
                      <>
                        {record.changePercent > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        <span className={record.changePercent > 0 ? 'text-red-500' : 'text-green-500'}>
                          {Math.abs(record.changePercent).toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {record.changeReason || '-'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {record.createdBy || 'Sistema'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
