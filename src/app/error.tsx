"use client";
import { PageTransition } from "@/components/ui/page-transition";

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <PageTransition>
      <div className="min-h-[60vh] grid place-items-center p-8 text-center">
        <div>
          <h1 className="text-3xl font-bold">Ocurrió un error</h1>
          <p className="text-muted-foreground mt-2">{error.message}</p>
          <button className="mt-4 rounded border px-3 py-1 hover:bg-gray-100" onClick={() => reset()}>
            Reintentar
          </button>
        </div>
      </div>
    </PageTransition>
  );
}