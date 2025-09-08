"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

interface UserWithRole {
  id: string;
  email: string;
  name?: string;
  roleId?: string;
  role?: Role;
  isApproved: boolean;
  isSuperAdmin: boolean;
}

export function usePermissions() {
  const { data: session, status } = useSession();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserWithRole | null>(null);

  useEffect(() => {
    async function fetchUserPermissions() {
      if (status === "authenticated" && session?.user) {
        try {
          const response = await fetch("/api/auth/me", {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Add cache prevention to avoid stale data
            cache: 'no-cache'
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            
            // If user is super admin, they have all permissions
            if (userData.isSuperAdmin) {
              setUserPermissions([
                { id: "super", resource: "*", action: "*", description: "Super Admin - All permissions" }
              ]);
            } else if (userData.role?.permissions) {
              setUserPermissions(userData.role.permissions);
            } else {
              // Default limited permissions for users without roles
              setUserPermissions([
                { id: "default-view", resource: "system", action: "view", description: "Basic view access" }
              ]);
            }
          } else {
            console.warn('Failed to fetch user data:', response.status);
            setUserPermissions([]);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user permissions:", error);
          setUserPermissions([]);
          setUser(null);
        }
      } else {
        setUserPermissions([]);
        setUser(null);
      }
      setLoading(false);
    }

    // Add debounce to prevent multiple rapid calls
    const timeoutId = setTimeout(fetchUserPermissions, 100);
    return () => clearTimeout(timeoutId);
  }, [session, status]);

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Super admins have all permissions
    if (user.isSuperAdmin) return true;
    
    // Check if user is approved
    if (!user.isApproved) return false;
    
    // Check specific permissions
    return userPermissions.some(permission => 
      (permission.resource === resource || permission.resource === "*") &&
      (permission.action === action || permission.action === "*")
    );
  };

  const canView = (resource: string) => hasPermission(resource, "view");
  const canCreate = (resource: string) => hasPermission(resource, "create");
  const canUpdate = (resource: string) => hasPermission(resource, "update");
  const canDelete = (resource: string) => hasPermission(resource, "delete");

  const isApproved = user?.isApproved || false;
  const isSuperAdmin = user?.isSuperAdmin || false;

  return {
    user,
    userPermissions,
    loading,
    hasPermission,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    isApproved,
    isSuperAdmin
  };
}