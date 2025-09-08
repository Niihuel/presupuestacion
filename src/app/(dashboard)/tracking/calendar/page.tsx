import { Suspense } from 'react';
import { Calendar } from "@/components/calendar/calendar";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { CalendarIcon } from "lucide-react";
import { PageHeader } from '@/components/ui/page-header';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para el calendario
 */
function CalendarLoading() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-80 mb-2 bg-muted rounded animate-pulse" />
              <div className="h-4 w-96 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Card>
      <div className="h-96 bg-muted rounded animate-pulse" />
    </div>
  );
}

/**
 * Página de calendario de seguimiento (Server Component)
 */
export default function TrackingCalendar() {
  return (
    <PageTransition>
      <div className="space-y-4">
        <PageHeader
          title="Calendario de Seguimiento"
          description="Gestiona plazos, seguimientos y eventos de presupuestación"
        />
        
        {/* Calendar wrapped in Suspense */}
        <Suspense fallback={<CalendarLoading />}>
          <Calendar />
        </Suspense>
      </div>
    </PageTransition>
  );
}