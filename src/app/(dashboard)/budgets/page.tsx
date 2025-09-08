import { Suspense } from 'react';
import BudgetsClient from './budgets-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la página de gestión de presupuestos
 */
function BudgetsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando gestión de presupuestos...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de gestión de presupuestos (Server Component)
 */
export default function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetsLoading />}>
      <BudgetsClient />
    </Suspense>
  );
}