import type { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
	// PrismaAdapter types are compatible at runtime but not perfectly aligned in TS
	secret: process.env.NEXTAUTH_SECRET,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	adapter: {
		...PrismaAdapter(prisma),
		createUser: async (data: Omit<AdapterUser, "id">) => {
			// Buscar rol por defecto: "Viewer" (usuarios de Google tienen permisos mínimos)
			const defaultRole = await prisma.role.findFirst({
				where: { name: "Viewer" },
			});
			
			// Parse the 'name' field from Google into firstName and lastName
			const fullName = (data as any).name || '';
			const nameParts = fullName.split(' ');
			const firstName = nameParts[0] || '';
			const lastName = nameParts.slice(1).join(' ') || '';
			
			// Remove the 'name' field and use firstName/lastName instead
			const { name: _, ...restData } = data as any;
			
			const userData = {
				...restData,
				firstName,
				lastName,
				roleId: defaultRole?.id,
				isApproved: true, // Google users are automatically approved
				active: true,
				provider: 'google',
			};
			return prisma.user.create({ data: userData });
		},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any,
	session: {
		strategy: "jwt",
		maxAge: 8 * 60 * 60, // 8 horas
		updateAge: 60 * 60, // Actualizar cada hora
	},
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			allowDangerousEmailAccountLinking: true,
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			authorize: async (credentials) => {
				if (!credentials?.email || !credentials?.password) return null;
				
				// Buscar usuario con su rol
				const user = await prisma.user.findUnique({ 
					where: { email: credentials.email },
					include: { role: true }
				});
				
				// Verificar que el usuario existe y está activo
				if (!user || !user.passwordHash || user.active === false) {
					console.log("User not found or inactive:", credentials.email);
					return null;
				}
				
				// Verificar que el usuario está aprobado (solo para registro manual)
				if (user.provider === 'manual' && !user.isApproved) {
					throw new Error('ACCOUNT_NOT_APPROVED');
				}
				
				const valid = await bcrypt.compare(credentials.password, user.passwordHash);
				if (!valid) {
					console.log("Invalid password for user:", credentials.email);
					return null;
				}
				
				// Registrar login exitoso
				await prisma.loginHistory.create({
					data: {
						userId: user.id,
						success: true,
						ipAddress: null // Se puede obtener del request en el futuro
					}
				});
				
				return { 
					id: user.id, 
					email: user.email!, 
					name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.name || user.email!,
					isApproved: user.isApproved,
					provider: user.provider || 'manual',
					roleId: user.roleId,
					isSuperAdmin: user.isSuperAdmin
				};
			},
		}),
	],
	pages: {
		signIn: "/login",
	},
	callbacks: {
		/**
		 * JWT Callback - Se ejecuta cada vez que se crea/actualiza un JWT
		 */
		async jwt({ token, user, account }) {
			// Si hay un usuario (primera vez o signIn), agregar datos al token
			if (user) {
				// Buscar datos completos del usuario en la base de datos
				const dbUser = await prisma.user.findUnique({
					where: { email: user.email! },
					include: { role: true }
				});
				
				if (dbUser) {
					token.userId = dbUser.id;
					token.roleId = dbUser.roleId;
					token.isApproved = dbUser.isApproved;
					token.provider = dbUser.provider || undefined;
					token.isSuperAdmin = dbUser.isSuperAdmin;
					token.active = dbUser.active;
					token.firstName = dbUser.firstName;
					token.lastName = dbUser.lastName;
				}
			}
			return token;
		},
		/**
		 * Callback de sesión - Se ejecuta cada vez que se verifica la sesión
		 * Con JWT strategy, los datos vienen del token
		 */
		async session({ session, token }) {
			// Agregar datos del token a la sesión
			if (token && session.user) {
				session.user = {
					...session.user,
					id: token.userId as string,
					roleId: token.roleId as string,
					isApproved: token.isApproved as boolean,
					provider: token.provider as string,
					isSuperAdmin: token.isSuperAdmin as boolean,
					active: token.active as boolean,
					name: `${token.firstName || ''} ${token.lastName || ''}`.trim() || session.user.email!
				};
			}
			return session;
		},
		/**
		 * Callback de inicio de sesión - Se ejecuta cuando un usuario intenta iniciar sesión
		 */
		async signIn({ user, account }) {
			try {
				// Manejar inicio de sesión con Google
				if (account?.provider === "google") {
					const existingUser = await prisma.user.findUnique({
						where: { email: user.email! }
					});

					if (!existingUser) {
						// El usuario será creado por el adapter
						return true;
					} else {
						// Actualizar usuario existente si es necesario
						if (existingUser.provider !== 'google') {
							await prisma.user.update({
								where: { email: user.email! },
								data: { 
									provider: 'google',
									image: user.image,
									isApproved: true,
									active: true
								}
							});
						}

						// Asegurar rol por defecto si no tiene
						if (!existingUser.roleId) {
							const defaultRole = await prisma.role.findFirst({ where: { name: 'Viewer' } });
							if (defaultRole?.id) {
								await prisma.user.update({
									where: { email: user.email! },
									data: { roleId: defaultRole.id }
								});
							}
						}
						
						// Registrar login exitoso
						await prisma.loginHistory.create({
							data: {
								userId: existingUser.id,
								success: true,
								ipAddress: null
							}
						});
						
						return true;
					}
				}
				// Para cualquier otro proveedor (incluido credentials), si el usuario no tiene rol, asignar el rol por defecto
				if (user?.email) {
					const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
					if (dbUser && !dbUser.roleId) {
						const defaultRole = await prisma.role.findFirst({ where: { name: 'Viewer' } });
						if (defaultRole?.id) {
							await prisma.user.update({ where: { email: user.email }, data: { roleId: defaultRole.id } });
						}
					}
				}
				return true;
			} catch (error) {
				console.error("Error in signIn callback:", error);
				return false;
			}
		},
		async redirect({ url, baseUrl }) {
			// Allows relative callback URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`;

			// Allows callback URLs on the same origin
			else if (new URL(url).origin === baseUrl) return url;

			return baseUrl + '/dashboard';
		}
	},
};



