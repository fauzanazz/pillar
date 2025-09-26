'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { SessionProvider, useSession } from '@/provider/SessionProvider';
import {
  hasRouteAccess,
  getDefaultRoute,
  ROUTES,
  findRouteConfig,
} from '@/config/routes';
import type { UserRole } from '@/config/routes';
import router from 'next/router';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuardContent = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const { isLoading, isInitialized } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Don't process routes until auth is initialized
    if (!isInitialized || typeof window === 'undefined') return;

    const processAuth = async () => {
      setIsProcessing(true);

      try {
        // Find route config (handles both exact and dynamic routes)
        const currentRoute = findRouteConfig(pathname);

        // If route doesn't exist, redirect to 404
        if (!currentRoute) {
          router.push('/404');
          return;
        }

        // Public routes that don't require auth
        const publicRoutes = ['/404', '/unauthorized'];
        const authRoutes = ['/login', '/'];
        const isPublicRoute = publicRoutes.some(route => pathname === route);
        const isAuthRoute = authRoutes.some(route => pathname === route);

        if (isAuthRoute) {
          // Redirect authenticated users away from login page
          if (isAuthenticated && user) {
            const defaultRoute = getDefaultRoute(user.role as UserRole);
            router.push(defaultRoute);
            return;
          }
          setIsProcessing(false);
          return;
        }

        if (isPublicRoute) {
          // Special case for login redirect
          if (pathname === '/login' && isAuthenticated && user) {
            const defaultRoute = getDefaultRoute(user.role as UserRole);
            router.push(defaultRoute);
            return;
          }
          setIsProcessing(false);
          return;
        }

        // Check authentication for protected routes
        if (!isAuthenticated || !user) {
          router.push('/login');
          return;
        }

        // Check role-based access
        const userRole = user.role as UserRole;

        if (!hasRouteAccess(pathname, userRole)) {
          console.log(
            'Access denied for role:',
            userRole,
            'to route:',
            pathname
          );
          // Redirect to user's default dashboard
          const defaultRoute = getDefaultRoute(userRole);
          router.push(defaultRoute);
          return;
        }

        console.log(
          'Access granted for role:',
          userRole,
          'to route:',
          pathname
        );
        setIsProcessing(false);
      } catch (error) {
        console.error('Error during auth guard processing:', error);
        router.push('/login');
      } finally {
        setIsProcessing(false);
      }
    };

    processAuth();
  }, [pathname, isAuthenticated, user, router, isInitialized]);

  // Show loading state while initializing auth or processing authorization
  if (isLoading || !isInitialized || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children after successful authorization
  const currentRoute = findRouteConfig(pathname);
  const publicRoutes = ['/login', '/', '/404', '/unauthorized'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // For public routes, render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, ensure user is authenticated and has access
  if (isAuthenticated && user && currentRoute) {
    const userRole = user.role as UserRole;
    if (hasRouteAccess(pathname, userRole)) {
      return <>{children}</>;
    }
  }

  // If we reach here, something went wrong - show loading while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

const AuthGuard = ({ children }: AuthGuardProps) => {
  return (
    <SessionProvider>
      <AuthGuardContent>{children}</AuthGuardContent>
    </SessionProvider>
  );
};

export default AuthGuard;
