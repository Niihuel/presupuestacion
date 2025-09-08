"use client";

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';
import * as React from "react";
import { Suspense } from "react";
import TrucksClient from "./trucks-client";
import { Loader2 } from "lucide-react";

/**
 * Loading component for trucks management
 */
function TrucksLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Cargando gestión de camiones...</span>
      </div>
    </div>
  );
}

/**
 * Trucks management page component
 */
export default function TrucksPage() {
  return (
    <Suspense fallback={<TrucksLoading />}>
      <TrucksClient />
    </Suspense>
  );
}


