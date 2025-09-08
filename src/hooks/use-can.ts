"use client";

import { usePermissions } from "./use-permissions";

export function useCan() {
  const { hasPermission, canView, canCreate, canUpdate, canDelete, isApproved, isSuperAdmin } = usePermissions();

  const can = {
    // Generic permission check
    access: (resource: string, action: string) => hasPermission(resource, action),
    
    // CRUD operations
    view: (resource: string) => canView(resource),
    create: (resource: string) => canCreate(resource),
    update: (resource: string) => canUpdate(resource),
    delete: (resource: string) => canDelete(resource),
    
    // Specific business logic permissions
    viewDashboard: () => isApproved && (canView("system") || isSuperAdmin),
    manageUsers: () => hasPermission("users", "update") || isSuperAdmin,
    manageRoles: () => hasPermission("roles", "update") || isSuperAdmin,
    createBudgets: () => hasPermission("budgets", "create"),
    approveBudgets: () => hasPermission("budgets", "approve") || isSuperAdmin,
    manageCustomers: () => hasPermission("customers", "update"),
    manageProjects: () => hasPermission("projects", "update"),
    viewReports: () => hasPermission("reports", "view"),
    manageSystem: () => hasPermission("system", "update") || isSuperAdmin,
  };

  return { can, isApproved, isSuperAdmin };
}