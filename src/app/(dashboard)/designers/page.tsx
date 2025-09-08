import { Suspense } from 'react';
import DesignersClient from './designers-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la página de diseñadores
 */
function DesignersLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando gestión de diseñadores...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de diseñadores (Server Component)
 */
export default function DesignersPage() {
  return (
    <Suspense fallback={<DesignersLoading />}>
      <DesignersClient />
    </Suspense>
  );
}




