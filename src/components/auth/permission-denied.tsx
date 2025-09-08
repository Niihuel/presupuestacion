"use client";

import { ShieldX, Lock, Mail } from "lucide-react";

interface PermissionDeniedProps {
  message?: string;
  showContactInfo?: boolean;
  className?: string;
}

export default function PermissionDenied({ 
  message = "No tienes permisos suficientes para acceder a esta funcionalidad", 
  showContactInfo = true,
  className = ""
}: PermissionDeniedProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mb-4">
        <ShieldX className="w-12 h-12 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Acceso Restringido
      </h3>
      
      <p className="text-muted-foreground mb-4 max-w-md">
        {message}
      </p>

      {showContactInfo && (
        <div className="bg-muted/50 rounded-lg p-4 max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">¿Necesitas acceso?</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Contacta al equipo de sistemas en{" "}
            <a 
              href="mailto:sistemas@pretensa.com.ar" 
              className="text-primary hover:underline"
            >
              sistemas@pretensa.com.ar
            </a>{" "}
            para solicitar los permisos necesarios.
          </p>
        </div>
      )}
    </div>
  );
}