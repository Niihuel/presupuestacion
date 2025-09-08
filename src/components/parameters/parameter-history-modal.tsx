'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ParameterHistory {
  id: string;
  parameterId: string;
  value: number;
  effectiveDate: string;
  createdAt: string;
}

interface ParameterHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameterId: string;
  name: string;
}

export function ParameterHistoryModal({ open, onOpenChange, parameterId, name }: ParameterHistoryModalProps) {
  const [history, setHistory] = useState<ParameterHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && parameterId) {
      fetchHistory();
    }
  }, [open, parameterId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/parameters/history?parameterId=${parameterId}`);
      setHistory(response.data);
    } catch (error) {
      toast.error('No se pudo cargar el historial del parámetro');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: 'value',
      header: 'Valor',
      cell: ({ row }: any) => row.original.value.toLocaleString('es-ES', { maximumFractionDigits: 2 }),
    },
    {
      accessorKey: 'effectiveDate',
      header: 'Fecha Efectiva',
      cell: ({ row }: any) => format(new Date(row.original.effectiveDate), 'dd/MM/yyyy', { locale: es }),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha de Registro',
      cell: ({ row }: any) => format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de Cambios - {name}</DialogTitle>
        </DialogHeader>
        
        <DataTable
          columns={columns}
          data={history}
          loading={loading}
        />
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}