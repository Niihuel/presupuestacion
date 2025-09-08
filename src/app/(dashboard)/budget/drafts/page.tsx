import { Suspense } from 'react';
import BudgetDraftsKanban from './budget-drafts-kanban';
import { Card } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { motion } from 'framer-motion';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

interface BudgetDraft {
  id: string;
  name: string;
  customerName: string;
  projectName?: string;
  status: 'draft' | 'in_progress' | 'review';
  lastModified: Date;
  createdAt: Date;
  totalAmount?: number;
  completionPercentage: number;
  items?: any[];
}

/**
 * Componente de esqueleto para mostrar mientras carga
 */
function BudgetDraftsLoading() {
  return (
    <PageTransition>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-80 mb-2 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 flex-1 max-w-md bg-muted rounded animate-pulse" />
          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="space-y-3 min-h-[400px] bg-muted/20 rounded-lg p-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Card key={j} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="h-4 w-32 mb-1 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-5 w-10 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <div className="h-8 flex-1 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

/**
 * Página principal de borradores de presupuesto (Server Component)
 * Usa el componente cliente que maneja su propia obtención de datos
 */
export default function BudgetDraftsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<BudgetDraftsLoading />}>
        <BudgetDraftsKanban initialDrafts={[]} />
      </Suspense>
    </PageTransition>
  );
}