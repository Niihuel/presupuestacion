# Testing Permission System for Customer Creation

## Summary
The permission error `Insufficient permissions: customers:create` has been successfully configured to show proper modals and error handling. Here's what was implemented:

## Changes Made

### 1. Enhanced Customer Client Component
- ✅ Added `usePermissionError` hook for handling permission errors with modal display
- ✅ Added `usePermissionGuard` hook for protecting actions
- ✅ Protected "Nuevo Cliente" button with permission guard
- ✅ Protected row actions (View, Edit, Delete) with permission guards
- ✅ Protected "Crear primer cliente" button in empty state
- ✅ Added `PermissionErrorModal` component to display permission errors

### 2. Improved API Error Handling
- ✅ Enhanced POST `/api/customers` route with detailed Spanish error messages
- ✅ Enhanced GET `/api/customers` route with consistent error handling
- ✅ Added specific error codes for different permission scenarios:
  - `UNAUTHORIZED` - User not logged in
  - `INSUFFICIENT_PERMISSIONS` - User lacks required permission
  - `NO_ROLE_ASSIGNED` - User has no role
  - `ACCOUNT_NOT_APPROVED` - User account pending approval

### 3. Permission Guard Implementation
- ✅ Used existing `PermissionGuardProvider` from layout.tsx
- ✅ Implemented custom messages for each action:
  - Create: "Necesitas permisos para crear clientes. Contacta al administrador del sistema."
  - View: "Necesitas permisos para ver detalles de clientes."
  - Edit: "Necesitas permisos para editar clientes."
  - Delete: "Necesitas permisos para eliminar clientes."

## How to Test

### Step 1: Login as Super Admin
1. Navigate to `http://localhost:3000/login`
2. Use credentials:
   - Email: `admin@pretensa.com`
   - Password: `Admin123!`

### Step 2: Test with User Role
1. Create a test user with "User" role (has limited permissions)
2. The "User" role only has:
   - `view` permissions for most resources
   - `budgets:create` permission
   - **NO** `customers:create` permission

### Step 3: Test Permission Modals
1. Login as a user with "User" role
2. Navigate to `/customers`
3. Try clicking "Nuevo Cliente" - should show permission modal
4. Try clicking any row action - should show appropriate permission modal

## Database Verification

Run this command to verify the permission setup:
```bash
npx tsx prisma/seed.ts
```

The seed script creates:
- **Super Admin** role: All permissions
- **Admin** role: Most permissions except system management
- **Manager** role: create/edit permissions for business entities
- **User** role: Limited view permissions + budget creation
- **Viewer** role: Only view permissions

## Permission Matrix for Customer Operations

| Role | customers:view | customers:create | customers:edit | customers:delete |
|------|-------|--------|------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ❌ |
| User | ✅ | ❌ | ❌ | ❌ |
| Viewer | ✅ | ❌ | ❌ | ❌ |

## Next Steps

1. **Login as Super Admin** to verify full functionality
2. **Create test users** with different roles to test permission restrictions
3. **Test each action** (Create, View, Edit, Delete) with different user roles
4. **Verify modal behavior** when permissions are denied

The permission system is now fully integrated and will show appropriate Spanish messages when users lack the required permissions for customer operations.