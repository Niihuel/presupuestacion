"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { useSession } from "next-auth/react";
import PermissionDenied from "./permission-denied";
import { ReactNode } from "react";

interface WithPermissionsProps {
  children: ReactNode;
  resource: string;
  action: string;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export default function WithPermissions({ 
  children, 
  resource, 
  action, 
  fallback,
  showFallback = true 
}: WithPermissionsProps) {
  const { status } = useSession();
  const { hasPermission, loading, isApproved } = usePermissions();

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // User is not authenticated
  if (status === "unauthenticated") {
    return showFallback ? (
      fallback || <PermissionDenied message="Debes iniciar sesión para acceder a esta funcionalidad" />
    ) : null;
  }

  // User is not approved
  if (!isApproved) {
    return showFallback ? (
      fallback || <PermissionDenied message="Tu cuenta está pendiente de aprobación por el equipo de sistemas" />
    ) : null;
  }

  // User doesn't have required permission
  if (!hasPermission(resource, action)) {
    return showFallback ? (
      fallback || <PermissionDenied />
    ) : null;
  }

  // User has permission, render children
  return <>{children}</>;
}