import { Suspense } from 'react';
import AdminPendingUsersTable from './admin-pending-users-table';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la tabla de usuarios pendientes
 */
function AdminPendingUsersLoading() {
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
 * Página principal de usuarios pendientes de aprobación (Server Component)
 */
export default function AdminPendingUsersPage() {
  return (
    <Suspense fallback={<AdminPendingUsersLoading />}>
      <AdminPendingUsersTable />
    </Suspense>
  );
}
