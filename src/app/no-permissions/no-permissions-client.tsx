"use client";
import { useRouter } from "next/navigation";
import { LogOut, ShieldAlert } from "lucide-react";
import { signOut } from "next-auth/react";
import { PageTransition } from "@/components/ui/page-transition";

export default function NoPermissionsClient() {
  const router = useRouter();
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="max-w-lg w-full bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/25 rounded-xl p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 grid place-items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Sin permisos asignados</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta está activa pero no tiene un rol asignado. Por favor, contacta a un administrador para que te otorgue permisos.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-md border border-border bg-background hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Ir al inicio
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 transition"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}