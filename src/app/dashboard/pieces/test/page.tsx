import { Suspense } from 'react';
import PiecesTestClient from './pieces-test-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para las pruebas de piezas
 */
function PiecesTestLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando pruebas del sistema...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de pruebas de piezas (Server Component)
 */
export default function PiecesTestPage() {
  return (
    <Suspense fallback={<PiecesTestLoading />}>
      <PiecesTestClient />
    </Suspense>
  );
}


