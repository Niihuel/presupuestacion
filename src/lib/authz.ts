import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Obtiene el usuario de la sesión actual
 * @returns Los datos del usuario de la sesión o null si no hay sesión
 */
export async function getSessionUser() {
	try {
		// Obtener la sesión usando NextAuth
		const session = await getServerSession(authOptions);
		
		if (!session?.user) {
			console.log("No session found");
			return null;
		}
		
		// La sesión ya tiene todos los datos necesarios gracias al callback de sesión
		return session.user;
	} catch (error) {
		console.error("Error in getSessionUser:", error);
		return null;
	}
}

/**
 * Requiere que el usuario esté autenticado
 * @throws Error si el usuario no está autenticado
 * @returns Los datos del usuario autenticado
 */
export async function requireAuth() {
	const user = await getSessionUser();
	if (!user) {
		throw new Error("Unauthorized");
	}
	return user;
}

/**
 * Verifica que el usuario tenga un permiso específico
 * @param resource - El recurso al que se quiere acceder
 * @param action - La acción que se quiere realizar
 * @throws Error si el usuario no tiene permisos
 * @returns Los datos del usuario si tiene permisos
 */
export async function requirePermission(resource: string, action: string) {
	try {
		const user = await requireAuth();
		
		// Verificar que el usuario tiene ID
		if (!user.id) {
			throw new Error("User ID not found in session");
		}

		// Verificar que el usuario está activo y aprobado
		if (!user.active) {
			throw new Error("User account is not active");
		}
		
		if (!user.isApproved) {
			throw new Error("User account is not approved");
		}

		// Super admin tiene todos los permisos
		if (user.isSuperAdmin) {
			console.log(`SuperAdmin ${user.email} accessing ${resource}:${action}`);
			return user;
		}

		// Si no tiene rol, denegar acceso EXCEPTO para permisos básicos de vista
		if (!user.roleId) {
			// Permitir permisos básicos de vista a usuarios aprobados sin rol
			if (action === "view" && ["dashboard", "budgets", "projects", "customers", "system"].includes(resource)) {
				console.log(`Allowing basic view permission for ${user.email} on ${resource} (no role assigned)`);
				return user;
			}
			throw new Error("User has no role assigned");
		}

		// Verificar permisos del rol
		const hasPermission = await prisma.rolePermission.findFirst({
			where: { 
				roleId: user.roleId, 
				permission: { 
					resource, 
					action 
				} 
			},
			include: {
				permission: true
			}
		});

		if (!hasPermission) {
			// Permitir permisos básicos de vista a usuarios aprobados
			if (action === "view" && ["dashboard", "budgets", "projects", "customers", "system"].includes(resource)) {
				console.log(`Allowing basic view permission for ${user.email} on ${resource}`);
				return user;
			}
			throw new Error(`Insufficient permissions: ${resource}:${action}`);
		}

		console.log(`User ${user.email} has permission for ${resource}:${action}`);
		return user;
	} catch (error) {
		// Reduce log noise for common permission check failures
		if (error instanceof Error && !error.message.includes('permission')) {
			console.error("Permission check failed:", error);
		}
		throw error;
	}
}

/**
 * Verifica si el usuario tiene un permiso específico (sin lanzar error)
 * @param resource - El recurso a verificar
 * @param action - La acción a verificar
 * @returns true si tiene el permiso, false si no
 */
export async function hasPermission(resource: string, action: string): Promise<boolean> {
	try {
		await requirePermission(resource, action);
		return true;
	} catch {
		return false;
	}
}

/**
 * Obtiene todos los permisos del usuario actual
 * @returns Lista de permisos del usuario
 */
export async function getUserPermissions() {
	try {
		const user = await getSessionUser();
		if (!user?.id) return [];

		// Super admin tiene todos los permisos
		if (user.isSuperAdmin) {
			const allPermissions = await prisma.permission.findMany();
			return allPermissions;
		}

		if (!user.roleId) return [];

		// Obtener permisos del rol
		const rolePermissions = await prisma.rolePermission.findMany({
			where: { roleId: user.roleId },
			include: { permission: true }
		});

		return rolePermissions.map(rp => rp.permission);
	} catch (error) {
		console.error("Error getting user permissions:", error);
		return [];
	}
}


