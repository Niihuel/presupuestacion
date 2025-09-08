"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldX, Mail } from "lucide-react";
import { UnifiedModal } from "@/components/ui/unified-modal";

interface PermissionDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string;
  resource?: string;
  customMessage?: string;
  showContactInfo?: boolean;
}

export function PermissionDeniedModal({
  isOpen,
  onClose,
  action = "realizar esta acción",
  resource = "",
  customMessage,
  showContactInfo = true
}: PermissionDeniedModalProps) {
  
  // Close modal on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const message = customMessage || 
    `No tienes permisos suficientes para ${action}${resource ? ` en ${resource}` : ""}.`;

  return (
    <UnifiedModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Acceso Denegado"
      size="md"
    >
      <div className="space-y-6">
        {/* Icono y mensaje principal */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="flex justify-center mb-4"
          >
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
              <ShieldX className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </motion.div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {message}
          </p>
        </div>

        {/* Información de contacto */}
        {showContactInfo && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                ¿Necesitas acceso?
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Contacta al equipo de sistemas en{" "}
              <a 
                href="mailto:sistemas@pretensa.com.ar" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                sistemas@pretensa.com.ar
              </a>{" "}
              para solicitar los permisos necesarios.
            </p>
          </div>
        )}

        {/* Botón de acción */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
}