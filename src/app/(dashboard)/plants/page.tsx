import { Suspense } from 'react';
import PlantsClient from './plants-client';
import { Loader2 } from 'lucide-react';

/**
 * Componente de carga para la página de plantas
 */
function PlantsLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando gestión de plantas...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de gestión de plantas (Server Component)
 */
export default function PlantsPage() {
  return (
    <Suspense fallback={<PlantsLoading />}>
      <PlantsClient />
    </Suspense>
  );
}


