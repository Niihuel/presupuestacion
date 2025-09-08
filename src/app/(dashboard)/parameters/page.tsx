import { Suspense } from 'react';
import ParametersClient from './parameters-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la página de parámetros
 */
function ParametersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando parámetros del sistema...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de parámetros (Server Component)
 */
export default function ParametersPage() {
  return (
    <Suspense fallback={<ParametersLoading />}>
      <ParametersClient />
    </Suspense>
  );
}


