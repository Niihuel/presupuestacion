import { Suspense } from 'react';
import LoginClient from './login-client';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la página de login
 */
function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/25 rounded-lg p-8">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Cargando...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal de login (Server Component)
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginClient />
    </Suspense>
  );
}