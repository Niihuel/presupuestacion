"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { UserPlus, Mail, Lock, User, Phone, Building, Briefcase, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";

export default function RegisterPage() {
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterInput) => {
		setLoading(true);
		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success("Registro exitoso", {
					description: "Tu solicitud ha sido enviada. Serás redirigido al login."
				});
				router.push("/login");
			} else {
				toast.error("Error en el registro", {
					description: result.error || "Ocurrió un error al procesar tu solicitud."
				});
			}
		} catch (error) {
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
              <h1 className="text-2xl font-semibold text-foreground">Crear Cuenta</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Registro con aprobación manual
              </p>
            </div>


            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Nombre
                  </label>
                  <input
                    {...register("firstName")}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    placeholder="Juan"
                  />
                  {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Apellido
                  </label>
                  <input
                    {...register("lastName")}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    placeholder="Pérez"
                  />
                  {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder="juan.perez@empresa.com"
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirmar Contraseña
                </label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              {/* Campos opcionales */}
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-3">Información adicional (opcional)</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Teléfono
                    </label>
                    <input
                      {...register("phone")}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Building className="w-4 h-4 inline mr-1" />
                      Departamento
                    </label>
                    <input
                      {...register("department")}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      placeholder="Sistemas, Ventas, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <Briefcase className="w-4 h-4 inline mr-1" />
                      Cargo
                    </label>
                    <input
                      {...register("position")}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      placeholder="Desarrollador, Analista, etc."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Crear Cuenta
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-primary hover:underline"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}


