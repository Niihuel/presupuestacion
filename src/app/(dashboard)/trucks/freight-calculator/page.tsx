import { Suspense } from "react";
import FreightCalculatorClient from "./freight-calculator-client";
import { Loader2 } from "lucide-react";

/**
 * Loading component for freight calculator
 */
function FreightCalculatorLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Cargando calculadora de fletes...</span>
      </div>
    </div>
  );
}

/**
 * Freight calculator page component
 */
export default function FreightCalculatorPage() {
  return (
    <Suspense fallback={<FreightCalculatorLoading />}>
      <FreightCalculatorClient />
    </Suspense>
  );
}