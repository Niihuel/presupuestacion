import { getSessionUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await getSessionUser();
        
        if (!user) {
            return NextResponse.json({ error: "No user session found" }, { status: 401 });
        }

        // Get full user data from database
        const dbUser = await prisma.user.findUnique({
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

        // Get all available permissions
        const allPermissions = await prisma.permission.findMany();
        
        // Get all roles
        const allRoles = await prisma.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        const debugInfo = {
            sessionUser: user,
            dbUser: dbUser ? {
                id: dbUser.id,
                email: dbUser.email,
                firstName: dbUser.firstName,
                lastName: dbUser.lastName,
                roleId: dbUser.roleId,
                isSuperAdmin: dbUser.isSuperAdmin,
                isApproved: dbUser.isApproved,
                active: dbUser.active,
                role: dbUser.role ? {
                    id: dbUser.role.id,
                    name: dbUser.role.name,
                    permissions: dbUser.role.permissions.map(rp => ({
                        resource: rp.permission.resource,
                        action: rp.permission.action
                    }))
                } : null
            } : null,
            allPermissions: allPermissions.map(p => ({ resource: p.resource, action: p.action })),
            allRoles: allRoles.map(r => ({
                id: r.id,
                name: r.name,
                permissionCount: r.permissions.length
            })),
            hasRolesViewPermission: dbUser?.role?.permissions.some(rp => 
                rp.permission.resource === 'roles' && rp.permission.action === 'view'
            ) || dbUser?.isSuperAdmin || false
        };

        return NextResponse.json(debugInfo);
    } catch (error) {
        console.error("Debug permissions error:", error);
        return NextResponse.json({ error: "Failed to get debug info", details: error }, { status: 500 });
    }
}