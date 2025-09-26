import { NextRequest, NextResponse } from 'next/server';
import { ROUTES, hasRouteAccess, getDefaultRoute, UserRole } from '@/config/routes';

// Middleware to handle authentication and role-based access
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth data from cookies or headers
  const authCookie = request.cookies.get('auth-storage');
  let user = null;
  let isAuthenticated = false;

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      user = authData.state?.user;
      isAuthenticated = authData.state?.isAuthenticated || false;
    } catch (error) {
      console.error('Error parsing auth cookie:', error);
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/', '/404', '/unauthorized'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If it's a public route, allow access
  if (isPublicRoute) {
    // Redirect authenticated users away from login page
    if (pathname === '/login' && isAuthenticated && user) {
      const defaultRoute = getDefaultRoute(user.role as UserRole);
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  if (!hasRouteAccess(pathname, user.role as UserRole)) {
    // If user tries to access unauthorized route, redirect to their default dashboard
    const defaultRoute = getDefaultRoute(user.role as UserRole);

    // If they're trying to access a different dashboard, redirect to theirs
    if (pathname !== defaultRoute) {
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }

    // Otherwise show unauthorized page
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

// Route matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};