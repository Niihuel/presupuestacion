'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdjustmentScaleModal } from '@/components/adjustment-scales/adjustment-scale-modal';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { SectionTransition } from '@/components/ui/page-transition';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';

interface AdjustmentScalesTableProps {
  initialScales?: any[];
}

export default function AdjustmentScalesTable({ initialScales = [] }: AdjustmentScalesTableProps) {
  const [scales, setScales] = useState(initialScales);
  const [loading, setLoading] = useState(false);
  const [selectedScale, setSelectedScale] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchScales = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/adjustment-scales');
      setScales(response.data);
    } catch (error) {
      toast.error('No se pudieron cargar las escalas de ajuste');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialScales.length === 0) {
      fetchScales();
    }
  }, [initialScales.length]);

  const handleActivate = async (id: string) => {
    try {
      await axios.patch(`/api/adjustment-scales/${id}`, { isActive: true });
      toast.success('Escala activada correctamente');
      fetchScales();
    } catch (error) {
      toast.error('No se pudo activar la escala');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta escala de ajuste?')) return;
    
    try {
      await axios.delete(`/api/adjustment-scales/${id}`);
      toast.success('Escala eliminada correctamente');
      fetchScales();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo eliminar la escala');
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Nombre',
    },
    {
      accessorKey: 'version',
      header: 'Versión',
      cell: ({ row }: any) => `v${row.original.version}`,
    },
    {
      accessorKey: 'generalDiscount',
      header: 'Descuento General (%)',
      cell: ({ row }: any) => `${row.original.generalDiscount}%`,
    },
    {
      accessorKey: 'generalAdjustment',
      header: 'Ajuste General (%)',
      cell: ({ row }: any) => `${row.original.generalAdjustment}%`,
    },
    {
      accessorKey: 'specialAdjustment',
      header: 'Ajuste Especial (%)',
      cell: ({ row }: any) => row.original.specialAdjustment ? `${row.original.specialAdjustment}%` : '-',
    },
    {
      accessorKey: 'specialCategories',
      header: 'Categorías Especiales',
      cell: ({ row }: any) => row.original.specialCategories || '-',
    },
    {
      accessorKey: 'effectiveDate',
      header: 'Fecha Efectiva',
      cell: ({ row }: any) => format(new Date(row.original.effectiveDate), 'dd/MM/yyyy', { locale: es }),
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          {!row.original.isActive && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActivate(row.original.id)}
                title="Activar escala"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedScale(row.original);
                setModalOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </motion.div>
          {!row.original.isActive && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Escalas de Ajuste"
        description="Gestione las escalas de descuento y ajuste para los presupuestos"
      >
        <Button
          onClick={() => {
            setSelectedScale(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Escala
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <SectionTransition delay={0.1} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Escalas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scales.length}</div>
              <p className="text-xs text-muted-foreground">
                Escalas configuradas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Escalas Activas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scales.filter((scale: any) => scale.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                En uso actualmente
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Escalas Inactivas
              </CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scales.filter((scale: any) => !scale.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Configuraciones guardadas
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionTransition>

      <DataTable
        columns={columns}
        data={scales}
        loading={loading}
      />

      <AdjustmentScaleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        scale={selectedScale}
        onSuccess={fetchScales}
      />
    </>
  );
}