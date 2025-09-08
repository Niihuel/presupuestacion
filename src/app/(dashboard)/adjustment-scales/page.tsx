import { Suspense } from 'react';
import AdjustmentScalesTable from './adjustment-scales-table';
import { Loader2 } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { motion } from 'framer-motion';

/**
 * Componente de carga para las escalas de ajuste
 */
function AdjustmentScalesLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Cargando escalas de ajuste...</span>
      </div>
    </div>
  );
}

/**
 * Página principal de escalas de ajuste (Server Component)
 */
export default function AdjustmentScalesPage() {
  return (
    <PageTransition>
      <Suspense fallback={<AdjustmentScalesLoading />}>
        <AdjustmentScalesTable />
      </Suspense>
    </PageTransition>
  );
}