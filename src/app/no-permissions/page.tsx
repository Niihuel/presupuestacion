import { Suspense } from 'react';
import NoPermissionsClient from './no-permissions-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la página de sin permisos
 */
function NoPermissionsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Cargando...</span>
      </div>
    </div>
  );
}

/**
 * Página principal de sin permisos (Server Component)
 */
export default function NoPermissionsPage() {
  return (
    <Suspense fallback={<NoPermissionsLoading />}>
      <NoPermissionsClient />
    </Suspense>
  );
}
