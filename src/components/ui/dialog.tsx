"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>({
  open: false,
});

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const value = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({ className, children, showCloseButton = true }: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(DialogContext);

  const handleClose = () => {
    onOpenChange?.(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          {/* Discord-style overlay with dark background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80" 
            onClick={handleClose} 
          />
          
          {/* Discord-style modal content with animation */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ 
              type: "spring",
              duration: 0.3,
              bounce: 0.15
            }}
            className={cn(
              "relative z-10 w-full max-w-md md:max-w-lg rounded-lg border bg-background shadow-xl",
              "flex flex-col max-h-[85vh]", // Set max height for scrolling
              className
            )}
          >
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              {children}
            </div>
            {showCloseButton && (
              <button 
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" 
                onClick={handleClose}
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ children, className, showCloseButton = false }: DialogHeaderProps) {
  const { onOpenChange } = React.useContext(DialogContext);
  
  const handleClose = () => {
    onOpenChange?.(false);
  };

  return (
    <div className={cn("border-b px-4 py-3 flex items-center justify-between", className)}>
      {children}
      {showCloseButton && (
        <button 
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" 
          onClick={handleClose}
          aria-label="Cerrar modal"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn("text-base font-medium", className)}>
      {children}
    </h2>
  );
}

export function DialogTrigger({ children, asChild, onClick }: DialogTriggerProps) {
  const { onOpenChange } = React.useContext(DialogContext);
  
  const handleClick = () => {
    onClick?.();
    onOpenChange?.(true);
  };
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    });
  }
  
  return (
    <button onClick={handleClick} type="button">
      {children}
    </button>
  );
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn("text-sm text-gray-500 mt-1", className)}>
      {children}
    </p>
  );
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}