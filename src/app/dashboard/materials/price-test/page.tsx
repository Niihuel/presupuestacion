import { Suspense } from 'react';
import MaterialPriceTestClient from './material-price-test-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para las pruebas de precios dinámicos
 */
function MaterialPriceTestLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando validación de precios dinámicos...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de pruebas de precios de materiales (Server Component)
 */
export default function MaterialPriceTestPage() {
  return (
    <Suspense fallback={<MaterialPriceTestLoading />}>
      <MaterialPriceTestClient />
    </Suspense>
  );
}
