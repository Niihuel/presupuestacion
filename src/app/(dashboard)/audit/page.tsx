import { Suspense } from 'react';
import AuditTable from './audit-table';
import { Card, CardHeader } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { Shield } from "lucide-react";
import { PageHeader } from '@/components/ui/page-header';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para la tabla de auditoría
 */
function AuditLoading() {
  return (
    <div className="space-y-6">
      <div className="h-20 bg-muted rounded animate-pulse" />
      <div className="h-96 bg-muted rounded animate-pulse" />
    </div>
  );
}

/**
 * Página principal de auditoría (Server Component)
 */
export default function AuditPage() {
  return (
    <PageTransition>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <PageHeader
          title="Auditoría"
          description="Registro de cambios y actividades del sistema"
        />
        
        {/* Audit Table wrapped in Suspense */}
        <Suspense fallback={<AuditLoading />}>
          <AuditTable />
        </Suspense>
      </div>
    </PageTransition>
  );
}