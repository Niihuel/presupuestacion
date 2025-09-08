"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, LogIn, UserX, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PermissionError {
  code: "INSUFFICIENT_PERMISSIONS" | "UNAUTHORIZED" | "FORBIDDEN" | "NETWORK_ERROR";
  message: string;
  requiredPermission?: string;
  action?: string;
  statusCode?: number;
}

export function useUnifiedPermissionError() {
  const [error, setError] = useState<PermissionError | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handlePermissionError = useCallback((error: any, context?: string) => {
    console.error("Permission error:", error);
    
    // Prevenir manejo recursivo de errores
    if (isOpen) {
      return;
    }
    
    let errorData: PermissionError;
    
    // Analizar el tipo de error
    if (error?.response?.status === 403) {
      const responseData = error.response.data;
      errorData = {
        code: "INSUFFICIENT_PERMISSIONS",
        message: responseData.message || "No tienes permisos para realizar esta acción",
        requiredPermission: responseData.requiredPermission,
        action: context,
        statusCode: 403
      };
      setError(errorData);
      setIsOpen(true);
    } else if (error?.response?.status === 401) {
      const responseData = error.response.data;
      errorData = {
        code: "UNAUTHORIZED",
        message: responseData.message || "Debes iniciar sesión para continuar",
        action: context,
        statusCode: 401
      };
      setError(errorData);
      setIsOpen(true);
    } else if (error?.message?.includes("Insufficient permissions")) {
      errorData = {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "No tienes los permisos necesarios para realizar esta acción",
        action: context
      };
      setError(errorData);
      setIsOpen(true);
    } else if (error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('network')) {
      errorData = {
        code: "NETWORK_ERROR",
        message: "Error de conexión. Por favor, verifica tu conexión a internet.",
        action: context
      };
      // Para errores de red, mostrar toast en lugar de modal
      toast.error(errorData.message);
    } else {
      // Para otros errores, mostrar toast con throttling
      let errorMessage = error?.response?.data?.message || error?.message || "Error inesperado";
      
      const errorKey = `toast_${errorMessage}`;
      const lastErrorTime = sessionStorage.getItem('lastErrorTime');
      const currentTime = Date.now();
      
      // Solo mostrar toast si han pasado más de 3 segundos desde el último error similar
      if (!lastErrorTime || (currentTime - parseInt(lastErrorTime)) > 3000) {
        toast.error(errorMessage);
        sessionStorage.setItem('lastErrorTime', currentTime.toString());
      }
    }
  }, [isOpen]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, []);

  const handleGoBack = useCallback(() => {
    closeModal();
    // Intentar navegar hacia atrás
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        router.push('/dashboard');
      }
    }
  }, [closeModal, router]);

  const handleLogin = useCallback(() => {
    closeModal();
    router.push('/login');
  }, [closeModal, router]);

  const getIcon = () => {
    if (!error) return null;
    
    switch (error.code) {
      case "INSUFFICIENT_PERMISSIONS":
        return <Shield className="h-16 w-16 text-red-500" />;
      case "UNAUTHORIZED":
        return <LogIn className="h-16 w-16 text-blue-500" />;
      case "FORBIDDEN":
        return <UserX className="h-16 w-16 text-red-600" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-500" />;
    }
  };

  const getTitle = () => {
    if (!error) return "";
    
    switch (error.code) {
      case "INSUFFICIENT_PERMISSIONS":
        return "Permisos Insuficientes";
      case "UNAUTHORIZED":
        return "Sesión Requerida";
      case "FORBIDDEN":
        return "Acceso Denegado";
      default:
        return "Error de Acceso";
    }
  };

  const getDescription = () => {
    if (!error) return "";
    
    switch (error.code) {
      case "INSUFFICIENT_PERMISSIONS":
        return "No tienes los permisos necesarios para acceder a esta funcionalidad. Contacta con el administrador del sistema si crees que deberías tener acceso.";
      case "UNAUTHORIZED":
        return "Tu sesión ha expirado o no has iniciado sesión. Por favor, inicia sesión para continuar.";
      case "FORBIDDEN":
        return "No tienes autorización para realizar esta acción.";
      default:
        return "Ha ocurrido un error al intentar acceder a esta funcionalidad.";
    }
  };

  const PermissionErrorModal = () => {
    if (!error || !isOpen) return null;

    return (
      <UnifiedModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title=""
        size="md"
        closeOnBackdropClick={false}
        showCloseButton={false}
      >
        <div className="text-center space-y-6 py-4">
          {/* Icono animado */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.5, 
              type: "spring",
              bounce: 0.3 
            }}
            className="flex justify-center"
          >
            {getIcon()}
          </motion.div>

          {/* Título y descripción */}
          <div className="space-y-2">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-[var(--text-primary)]"
            >
              {getTitle()}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[var(--text-secondary)] leading-relaxed"
            >
              {getDescription()}
            </motion.p>
          </div>

          {/* Detalles del error */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--surface-secondary)] p-4 rounded-lg text-left space-y-2"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p><strong>Mensaje:</strong> {error.message}</p>
                {error.requiredPermission && (
                  <p>
                    <strong>Permiso requerido:</strong>{" "}
                    <code className="bg-[var(--surface-primary)] px-2 py-1 rounded text-xs font-mono">
                      {error.requiredPermission}
                    </code>
                  </p>
                )}
                {error.action && (
                  <p><strong>Acción:</strong> {error.action}</p>
                )}
                {error.statusCode && (
                  <p><strong>Código:</strong> {error.statusCode}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Botones de acción */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 justify-center flex-wrap"
          >
            <Button 
              variant="outline" 
              onClick={closeModal}
              className="min-w-[100px]"
            >
              Entendido
            </Button>
            
            {error.code === "UNAUTHORIZED" ? (
              <Button 
                onClick={handleLogin}
                className="min-w-[120px]"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={handleGoBack}
                className="min-w-[120px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver Atrás
              </Button>
            )}
          </motion.div>

          {/* Información de contacto para casos de permisos */}
          {error.code === "INSUFFICIENT_PERMISSIONS" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-[var(--text-secondary)] border-t border-[var(--surface-border)] pt-4"
            >
              <p>
                ¿Necesitas acceso? Contacta al equipo de sistemas en{" "}
                <a 
                  href="mailto:sistemas@pretensa.com.ar" 
                  className="text-[var(--accent-primary)] hover:underline font-medium"
                >
                  sistemas@pretensa.com.ar
                </a>
              </p>
            </motion.div>
          )}
        </div>
      </UnifiedModal>
    );
  };

  return {
    handlePermissionError,
    PermissionErrorModal,
    closeModal,
    error,
    isOpen
  };
}
