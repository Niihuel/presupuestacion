import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware para proteger rutas
 * Verifica que el usuario esté autenticado antes de permitir acceso
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    '/login',
    '/register', 
    '/api/auth',
    '/api/register',
    '/_next',
    '/favicon.ico'
  ];

  // Verificar si es una ruta pública
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  try {
    // Verificar token JWT de NextAuth
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Si no hay token válido, redirigir al login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar que el usuario esté activo y aprobado
    if (token.active === false || token.isApproved === false) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'AccountNotApproved');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error in middleware:', error);
    // En caso de error, redirigir al login por seguridad
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'SessionError');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = { 
  matcher: [
    '/dashboard/:path*',
    '/budget/:path*',
    '/projects/:path*',
    '/customers/:path*',
    '/admin/:path*',
    '/api/dashboard/:path*',
    '/api/budget/:path*',
    '/api/projects/:path*',
    '/api/pieces/:path*',
    '/api/materials/:path*'
  ] 
};



