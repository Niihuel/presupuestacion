"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, LogIn, UserX, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PermissionError {
  code: "INSUFFICIENT_PERMISSIONS" | "UNAUTHORIZED" | "FORBIDDEN";
  message: string;
  requiredPermission?: string;
  action?: string;
}

export function usePermissionError() {
  const [error, setError] = useState<PermissionError | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handlePermissionError = (error: any, context?: string) => {
    console.error("Permission error:", error);
    
    // Prevent recursive error handling
    if (isOpen) {
      return;
    }
    
    // Check if it's a permission-related error
    if (error?.response?.status === 403) {
      const errorData = error.response.data;
      setError({
        code: "INSUFFICIENT_PERMISSIONS",
        message: errorData.message || "No tienes permisos para realizar esta acción",
        requiredPermission: errorData.requiredPermission,
        action: context
      });
      setIsOpen(true);
    } else if (error?.response?.status === 401) {
      const errorData = error.response.data;
      setError({
        code: "UNAUTHORIZED",
        message: errorData.message || "Debes iniciar sesión para continuar",
        action: context
      });
      setIsOpen(true);
    } else if (error?.message?.includes("Insufficient permissions")) {
      setError({
        code: "INSUFFICIENT_PERMISSIONS",
        message: "No tienes los permisos necesarios para realizar esta acción",
        action: context
      });
      setIsOpen(true);
    } else {
      // For non-permission errors, show a toast with proper network error handling
      let errorMessage = error?.response?.data?.message || error?.message || "Error inesperado";
      
      // Handle network errors specifically
      if (error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('network')) {
        errorMessage = "Error de conexión. Por favor, verifica tu conexión a internet.";
      }
      
      // Prevent duplicate toasts by checking if the same error was recently shown
      const errorKey = `toast_${errorMessage}_${Date.now()}`;
      const lastErrorKey = sessionStorage.getItem('lastErrorToast');
      const lastErrorTime = sessionStorage.getItem('lastErrorTime');
      const currentTime = Date.now();
      
      // Only show toast if it's a different error or more than 3 seconds have passed
      if (!lastErrorKey || errorMessage !== lastErrorKey || 
          !lastErrorTime || (currentTime - parseInt(lastErrorTime)) > 3000) {
        toast.error(errorMessage);
        sessionStorage.setItem('lastErrorToast', errorMessage);
        sessionStorage.setItem('lastErrorTime', currentTime.toString());
      }
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setError(null);
  };

  const handleGoBack = () => {
    closeModal();
    // Try to navigate back to the previous page
    if (typeof window !== 'undefined') {
      // Check if there's actual history to go back to
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // If no history, navigate to dashboard
        router.push('/dashboard');
      }
    }
  };

  const handleLogin = () => {
    closeModal();
    router.push('/login');
  };

  const PermissionErrorModal = () => {
    if (!error) return null;

    const getIcon = () => {
      switch (error.code) {
        case "INSUFFICIENT_PERMISSIONS":
          return <Shield className="h-12 w-12 text-red-500" />;
        case "UNAUTHORIZED":
          return <LogIn className="h-12 w-12 text-blue-500" />;
        default:
          return <UserX className="h-12 w-12 text-gray-500" />;
      }
    };

    const getTitle = () => {
      switch (error.code) {
        case "INSUFFICIENT_PERMISSIONS":
          return "Permisos Insuficientes";
        case "UNAUTHORIZED":
          return "Sesión Requerida";
        default:
          return "Acceso Denegado";
      }
    };

    const getDescription = () => {
      switch (error.code) {
        case "INSUFFICIENT_PERMISSIONS":
          return "No tienes los permisos necesarios para acceder a esta funcionalidad. Contacta con el administrador del sistema si crees que deberías tener acceso.";
        case "UNAUTHORIZED":
          return "Tu sesión ha expirado o no has iniciado sesión. Por favor, inicia sesión para continuar.";
        default:
          return "No tienes autorización para realizar esta acción.";
      }
    };

    return (
      <Modal open={isOpen} onOpenChange={(open) => {
        if (!open) {
          closeModal();
        }
      }} title="">
        <div className="text-center space-y-6 py-4">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="flex justify-center"
          >
            {getIcon()}
          </motion.div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              {getTitle()}
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              {getDescription()}
            </p>
          </div>

          {/* Error details */}
          <div className="bg-[var(--surface-secondary)] p-4 rounded-lg text-left">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-2">
                <p><strong>Mensaje:</strong> {error.message}</p>
                {error.requiredPermission && (
                  <p><strong>Permiso requerido:</strong> <code className="bg-[var(--surface-primary)] px-1 py-0.5 rounded text-xs">{error.requiredPermission}</code></p>
                )}
                {error.action && (
                  <p><strong>Acción:</strong> {error.action}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={closeModal}>
              Entendido
            </Button>
            {error.code === "UNAUTHORIZED" ? (
              <Button onClick={handleLogin}>
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleGoBack}>
                Volver Atrás
              </Button>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  return {
    handlePermissionError,
    PermissionErrorModal,
    closeModal,
    error
  };
}