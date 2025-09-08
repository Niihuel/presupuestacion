import { Metadata } from 'next';
import { Suspense } from 'react';
import BudgetWizard from '@/components/budget-wizard/BudgetWizard';
import { Loader2 } from 'lucide-react';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Nuevo Presupuesto - PRETENSA',
  description: 'Wizard para crear presupuestos completos con cálculo automático de costos'
};

/**
 * Componente de carga para el wizard de presupuesto
 */
function BudgetWizardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Cargando wizard...</span>
      </div>
    </div>
  );
}

interface BudgetWizardPageProps {
  searchParams: Promise<{
    resume?: string;
    budget?: string;
    draftId?: string;
  }>;
}

/**
 * Página principal del wizard de presupuesto (Server Component)
 */
export default async function BudgetWizardPage({ searchParams }: BudgetWizardPageProps) {
  const params = await searchParams;
  return (
    <Suspense fallback={<BudgetWizardLoading />}>
      <BudgetWizard 
        resumeToken={params.resume}
        budgetId={params.budget}
        draftId={params.draftId}
      />
    </Suspense>
  );
}
