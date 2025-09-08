import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      );
    }

    // Get user with roles and permissions
    const userWithPermissions = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const permissions = userWithPermissions?.role?.permissions?.map((rp: any) => ({
      resource: rp.permission.resource,
      action: rp.permission.action,
    })) || [];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: userWithPermissions?.role?.name,
        isSuperAdmin: user.isSuperAdmin
      },
      permissions,
      hasDashboardView: permissions.some(p => p.resource === 'dashboard' && p.action === 'view'),
      hasSystemView: permissions.some(p => p.resource === 'system' && p.action === 'view'),
      hasAuditView: permissions.some(p => p.resource === 'audit' && p.action === 'view'),
      hasBudgetsView: permissions.some(p => p.resource === 'budgets' && p.action === 'view'),
      hasProjectsView: permissions.some(p => p.resource === 'projects' && p.action === 'view')
    });

  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
