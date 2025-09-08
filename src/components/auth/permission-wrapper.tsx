"use client";

import { ReactNode } from "react";
import { useCan } from "@/hooks/use-can";

interface PermissionWrapperProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
  hideWhenNoPermission?: boolean;
}

/**
 * Componente wrapper que condiciona el renderizado basado en permisos
 * @param resource - El recurso a verificar (ej: "budgets", "customers")
 * @param action - La acción a verificar (ej: "view", "create", "update")
 * @param children - Contenido a mostrar si tiene permisos
 * @param fallback - Contenido alternativo si no tiene permisos
 * @param hideWhenNoPermission - Si es true, no muestra nada cuando no hay permisos (por defecto true)
 */
export function PermissionWrapper({
  resource,
  action,
  children,
  fallback,
  hideWhenNoPermission = true
}: PermissionWrapperProps) {
  const { can, isApproved } = useCan();

  // Si el usuario no está aprobado, no mostrar nada
  if (!isApproved) {
    return hideWhenNoPermission ? null : (fallback || null);
  }

  // Verificar si tiene el permiso específico
  const hasPermission = can.access(resource, action);

  if (hasPermission) {
    return <>{children}</>;
  }

  // Si no tiene permisos
  if (hideWhenNoPermission) {
    return null;
  }

  return <>{fallback}</>;
}

/**
 * Hook para verificar múltiples permisos
 */
export function usePermissionCheck() {
  const { can, isApproved, isSuperAdmin } = useCan();

  const checkPermission = (resource: string, action: string): boolean => {
    if (!isApproved) return false;
    return can.access(resource, action);
  };

  const checkAnyPermission = (permissions: Array<{resource: string, action: string}>): boolean => {
    if (!isApproved) return false;
    return permissions.some(({ resource, action }) => can.access(resource, action));
  };

  const checkAllPermissions = (permissions: Array<{resource: string, action: string}>): boolean => {
    if (!isApproved) return false;
    return permissions.every(({ resource, action }) => can.access(resource, action));
  };

  return {
    checkPermission,
    checkAnyPermission, 
    checkAllPermissions,
    isApproved,
    isSuperAdmin
  };
}
