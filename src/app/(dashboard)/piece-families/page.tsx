import { Suspense } from 'react';
import PieceFamiliesClient from './piece-families-client';
import { Loader2 } from 'lucide-react';

/**
 * Componente de carga para la página de gestión de familias de piezas
 */
function PieceFamiliesLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando gestión de familias de piezas...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de gestión de familias de piezas (Server Component)
 */
export default function PieceFamiliesPage() {
  return (
    <Suspense fallback={<PieceFamiliesLoading />}>
      <PieceFamiliesClient />
    </Suspense>
  );
}