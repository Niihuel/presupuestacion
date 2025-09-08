import { Suspense } from 'react';
import NewBudgetForm from './new-budget-form';

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

/**
 * Componente de carga para el formulario
 */
function NewBudgetLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="flex gap-2">
        {[1,2,3,4,5,6].map(n => (
          <div key={n} className="h-8 w-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Página de nuevo presupuesto (Server Component)
 * Usa el componente cliente que maneja su propia obtención de datos
 */
export default function NewBudgetPage() {
  return (
    <Suspense fallback={<NewBudgetLoading />}>
      <NewBudgetForm 
        initialCustomers={[]}
        initialPlants={[]}
        initialPieces={[]}
      />
    </Suspense>
  );
}


