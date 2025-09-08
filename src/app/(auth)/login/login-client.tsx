"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { PageTransition } from "@/components/ui/page-transition";

export default function LoginClient() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();

	// Destino al que debemos volver después del login
	const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

	useEffect(() => {
		const errorParam = searchParams.get("error");
		if (errorParam === "OAuthAccountNotLinked") {
			toast.error("Error de autenticación", {
				description:
					"Este email ya está registrado. Inicia sesión con el método original para vincular tu cuenta de Google.",
			});
		}
	}, [searchParams]);
	
	const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginInput) => {
		setLoading(true);
		setError(null);
		
		try {
			const result = await signIn("credentials", {
				email: data.email,
				password: data.password,
				redirect: false,
			});

			if (result?.error) {
				setError("Credenciales inválidas o cuenta no aprobada");
				toast.error("Error de inicio de sesión", {
					description: "Verifica tus credenciales o contacta a sistemas si tu cuenta no ha sido aprobada."
				});
			} else if (result?.ok) {
				toast.success("Inicio de sesión exitoso", {
					description: "Redirigiendo al dashboard..."
				});
				// Usamos navegación completa para asegurar que el middleware vea la cookie de sesión
				window.location.href = callbackUrl;
			}
		} catch (error) {
			setError("Error de conexión");
			toast.error("Error de conexión", {
				description: "No se pudo conectar con el servidor. Intenta nuevamente."
			});
		}
		
		setLoading(false);
	};


	return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="w-full max-w-md">
          <div className="bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/25 rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Image 
                  src="/multimedia/logo.png" 
                  alt="PRETENSA Logo" 
                  width={120} 
                  height={60} 
                  className="object-contain"
                />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Iniciar Sesión</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Accede a tu cuenta PRETENSA
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}


            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder="tu.email@empresa.com"
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Contraseña
                </label>
                <input
                  {...register("password")}
                  type="password"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-black/60 text-muted-foreground">O continúa con</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 mt-4 border border-border rounded-md bg-background text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="text-primary hover:underline"
                >
                  Registrarse
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}