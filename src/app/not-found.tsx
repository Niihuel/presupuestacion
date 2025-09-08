import { PageTransition } from "@/components/ui/page-transition";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="min-h-[60vh] grid place-items-center p-8 text-center">
        <div>
          <h1 className="text-3xl font-bold">404 - Página no encontrada</h1>
          <p className="text-muted-foreground mt-2">La página que intentas acceder no existe.</p>
        </div>
      </div>
    </PageTransition>
  );
}