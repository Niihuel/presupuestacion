import { Suspense } from 'react';
import PiecesClient from './pieces-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la página de gestión de piezas
 */
function PiecesLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando gestión de piezas...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de gestión de piezas (Server Component)
 */
export default function PiecesPage() {
  return (
    <Suspense fallback={<PiecesLoading />}>
      <PiecesClient />
    </Suspense>
  );
}
