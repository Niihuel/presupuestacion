import { PageTransition } from "@/components/ui/page-transition";

export default function Home() {
  return (
    <PageTransition>
      <div className="min-h-screen grid place-items-center p-8">
        <main className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Presupuestación PRETENSA</h1>
          <p className="text-muted-foreground">Proyecto inicializado. Ir a /login</p>
        </main>
      </div>
    </PageTransition>
  );
}