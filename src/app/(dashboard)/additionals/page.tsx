import { Suspense } from 'react';
import AdditionalsClient from './additionals-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la página de adicionales
 */
function AdditionalsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando catálogo de adicionales...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de adicionales (Server Component)
 */
export default function AdditionalsPage() {
  return (
    <Suspense fallback={<AdditionalsLoading />}>
      <AdditionalsClient />
    </Suspense>
  );
}

