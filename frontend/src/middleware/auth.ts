import { NextRequest, NextResponse } from 'next/server';

// Simplified middleware that mainly handles static assets and API routes
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to static assets, API routes, and other system routes
  const allowedPaths = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
  ];

  if (allowedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For all other routes, let the AuthGuard component handle authentication
  // The middleware now primarily serves to ensure proper handling of requests
  return NextResponse.next();
}

// Route matcher configuration - now more focused on system routes
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
