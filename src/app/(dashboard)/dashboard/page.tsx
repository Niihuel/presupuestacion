import { Suspense } from 'react';
import DashboardClient from './dashboard-client';
import { Loader2 } from 'lucide-react';

/**
 * Componente de carga para el dashboard
 */
function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando dashboard...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal del dashboard (Server Component)
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient />
    </Suspense>
  );
}


