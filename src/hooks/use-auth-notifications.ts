"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

export function useAuthNotifications() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasShownSuccessToast = useRef(false);
  const hasShownErrorToast = useRef(false);
  const sessionStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Handle callback URL parameters
    const error = searchParams.get("error");
    const verified = searchParams.get("verified");

    if (error && !hasShownErrorToast.current) {
      hasShownErrorToast.current = true;
      
      // Prevent duplicate error toasts
      const errorKey = `auth_error_${error}`;
      const lastErrorShown = sessionStorage.getItem(errorKey);
      const currentTime = Date.now();
      
      // Only show error if not shown in the last 5 minutes
      if (!lastErrorShown || (currentTime - parseInt(lastErrorShown)) > 5 * 60 * 1000) {
        switch (error) {
          case "OAuthAccountNotLinked":
            toast.error("Error de autenticación", {
              description: "Este email ya está registrado. Inicia sesión con el método original para vincular tu cuenta de Google.",
            });
            break;
          case "ACCOUNT_NOT_APPROVED":
            toast.error("Cuenta no aprobada", {
              description: "Tu cuenta está pendiente de aprobación por el equipo de sistemas.",
            });
            break;
          default:
            toast.error("Error de autenticación", {
              description: "Ocurrió un error durante el proceso de autenticación.",
            });
        }
        
        sessionStorage.setItem(errorKey, currentTime.toString());
      }
      
      // Clean URL after showing error
      router.replace("/login", { scroll: false });
    }

    if (verified === "true" && !hasShownSuccessToast.current) {
      hasShownSuccessToast.current = true;
      
      // Prevent duplicate verification toasts
      const verifyKey = "auth_verified";
      const lastVerifyShown = sessionStorage.getItem(verifyKey);
      const currentTime = Date.now();
      
      // Only show verification toast if not shown in the last 5 minutes
      if (!lastVerifyShown || (currentTime - parseInt(lastVerifyShown)) > 5 * 60 * 1000) {
        toast.success("Cuenta verificada", {
          description: "Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.",
          duration: 5000,
        });
        
        sessionStorage.setItem(verifyKey, currentTime.toString());
      }
      
      // Clean URL after showing success
      router.replace("/login", { scroll: false });
    }

    // Show success notification only for NEW sessions (not existing ones)
    if (status === "authenticated" && session?.user && !hasShownSuccessToast.current) {
      // Check if this is a new session or an existing one
      const sessionKey = `auth_session_${session.user.email}`;
      const lastLoginNotification = sessionStorage.getItem(sessionKey);
      const currentTime = Date.now();
      
      // Only show notification if:
      // 1. No previous notification was stored, OR
      // 2. The last notification was more than 5 minutes ago (indicating a new login)
      const shouldShowNotification = !lastLoginNotification || 
        (currentTime - parseInt(lastLoginNotification, 10)) > 5 * 60 * 1000;

      if (shouldShowNotification) {
        // Only show if coming from login page or callback (indicating fresh login)
        const fromLoginPage = window.location.pathname === "/login" || 
                             window.location.pathname === "/" ||
                             document.referrer.includes("/login") ||
                             searchParams.get("callbackUrl") !== null;

        if (fromLoginPage) {
          hasShownSuccessToast.current = true;
          
          const userName = session.user.name || session.user.email;
          const provider = (session.user as { provider?: string })?.provider;
          
          let description = `Bienvenido de vuelta, ${userName}`;
          if (provider === "google") {
            description = `Inicio de sesión exitoso con Google. Bienvenido, ${userName}`;
          }

          toast.success("Sesión iniciada correctamente", {
            description,
            duration: 4000,
          });

          // Store the timestamp to prevent showing on refresh
          sessionStorage.setItem(sessionKey, currentTime.toString());

          // Redirect to dashboard if not already there
          if (window.location.pathname === "/login" || window.location.pathname === "/") {
            router.push("/dashboard");
          }
        }
      }
    }
  }, [session, status, searchParams, router]);

  // Reset toast flags and clean sessionStorage when session ends
  useEffect(() => {
    if (status === "unauthenticated") {
      hasShownSuccessToast.current = false;
      hasShownErrorToast.current = false;
      // Clean up sessionStorage when user logs out
      // Note: session might be null when unauthenticated
    }
  }, [status]);

  return { session, status };
}