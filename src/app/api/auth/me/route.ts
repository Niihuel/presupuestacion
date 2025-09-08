import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user) return NextResponse.json({ user: null }, { status: 401 });

	try {
		// Get complete user data with role and permissions
		const userWithRole = await prisma.user.findUnique({
			where: { 
				id: (session.user as { id: string }).id 
			},
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

		if (!userWithRole) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Transform the data to a cleaner format
		const userData = {
			id: userWithRole.id,
			email: userWithRole.email,
			name: userWithRole.name || `${userWithRole.firstName || ''} ${userWithRole.lastName || ''}`.trim(),
			firstName: userWithRole.firstName,
			lastName: userWithRole.lastName,
			image: userWithRole.image,
			isApproved: userWithRole.isApproved,
			isSuperAdmin: userWithRole.isSuperAdmin,
			active: userWithRole.active,
			provider: userWithRole.provider,
			roleId: userWithRole.roleId,
			role: userWithRole.role ? {
				id: userWithRole.role.id,
				name: userWithRole.role.name,
				description: userWithRole.role.description,
				permissions: userWithRole.role.permissions.map(rp => ({
					id: rp.permission.id,
					resource: rp.permission.resource,
					action: rp.permission.action,
					description: rp.permission.description
				}))
			} : null
		};

		return NextResponse.json(userData);
	} catch (error) {
		console.error("Error fetching user data:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}


