"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[95vw] max-h-[95vh]"
};

export function UnifiedModal({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true
}: UnifiedModalProps) {
  
  // Manejar el cierre del modal
  const handleClose = React.useCallback(() => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  }, [onClose, onOpenChange]);

  // Prevenir scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Manejar tecla Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, closeOnEscape, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop que cubre toda la pantalla */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdropClick ? handleClose : undefined}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh'
            }}
          />
          
          {/* Modal Container - Centrado perfectamente */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring", 
                duration: 0.3,
                bounce: 0.1 
              }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full rounded-2xl border border-gray-200 dark:border-gray-700",
                "bg-white dark:bg-gray-900 shadow-2xl",
                "max-h-[90vh] overflow-hidden flex flex-col",
                sizeClasses[size],
                className
              )}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div>
                    {title && (
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={handleClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Cerrar modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Componentes adicionales para casos específicos
export function ModalHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border-b border-gray-200 dark:border-gray-700 px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function ModalTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-xl font-semibold text-gray-900 dark:text-gray-100", className)}>
      {children}
    </h2>
  );
}

export function ModalDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-gray-600 dark:text-gray-400 mt-1", className)}>
      {children}
    </p>
  );
}

export function ModalContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", 
      "border-t border-gray-200 dark:border-gray-700 px-6 py-4 gap-2",
      className
    )}>
      {children}
    </div>
  );
}
