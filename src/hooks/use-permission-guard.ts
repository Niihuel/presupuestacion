"use client";

import { useCallback } from "react";
import { useCan } from "./use-can";
import { usePermissionModal } from "@/components/auth/permission-guard-provider";

interface PermissionGuardOptions {
  showModal?: boolean;
  customMessage?: string;
  onDenied?: (resource: string, action: string) => void;
}

interface PermissionCheckResult {
  allowed: boolean;
  showModal?: () => void;
}

export function usePermissionGuard() {
  const { can } = useCan();
  const { showPermissionModal } = usePermissionModal();

  const checkPermission = useCallback((
    resource: string, 
    action: string, 
    options: PermissionGuardOptions = {}
  ): PermissionCheckResult => {
    const { showModal = true, customMessage, onDenied } = options;
    
    const hasPermission = can.access(resource, action);
    
    if (!hasPermission) {
      // Call custom denied handler if provided
      onDenied?.(resource, action);
      
      // Show modal if requested
      if (showModal) {
        const showModalFunc = () => {
          showPermissionModal(action, resource, customMessage);
        };
        
        return { allowed: false, showModal: showModalFunc };
      }
      
      return { allowed: false };
    }
    
    return { allowed: true };
  }, [can, showPermissionModal]);

  // Convenience methods for common operations
  const canView = useCallback((resource: string, options?: PermissionGuardOptions) => 
    checkPermission(resource, "view", options), [checkPermission]);
    
  const canCreate = useCallback((resource: string, options?: PermissionGuardOptions) => 
    checkPermission(resource, "create", options), [checkPermission]);
    
  const canEdit = useCallback((resource: string, options?: PermissionGuardOptions) => 
    checkPermission(resource, "edit", options), [checkPermission]);
    
  const canDelete = useCallback((resource: string, options?: PermissionGuardOptions) => 
    checkPermission(resource, "delete", options), [checkPermission]);

  // Guard function for actions - executes callback only if permission is granted
  const guardAction = useCallback(<T extends unknown[]>(
    resource: string,
    action: string,
    callback: (...args: T) => void,
    options: PermissionGuardOptions = {}
  ) => {
    return (...args: T) => {
      const result = checkPermission(resource, action, options);
      if (result.allowed) {
        callback(...args);
      } else if (result.showModal) {
        result.showModal();
      }
    };
  }, [checkPermission]);

  // Guard function for async actions
  const guardAsyncAction = useCallback(<T extends unknown[], R>(
    resource: string,
    action: string,
    callback: (...args: T) => Promise<R>,
    options: PermissionGuardOptions = {}
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      const result = checkPermission(resource, action, options);
      if (result.allowed) {
        return callback(...args);
      } else if (result.showModal) {
        result.showModal();
        return undefined;
      }
      return undefined;
    };
  }, [checkPermission]);

  return {
    // Permission checking methods
    checkPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    
    // Action guards
    guardAction,
    guardAsyncAction,
    
    // Direct access to permission system
    can
  };
}