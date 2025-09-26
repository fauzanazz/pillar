'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { SessionProvider, useSession } from '@/provider/SessionProvider';
import { hasRouteAccess, getDefaultRoute, ROUTES } from '@/config/routes';
import type { UserRole } from '@/config/routes';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuardContent = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const { isLoading, isInitialized } = useSession();

  useEffect(() => {
    // Don't process routes until auth is initialized
    if (!isInitialized || typeof window === 'undefined') return;

    const currentRoute = Object.values(ROUTES).find(
      route => route.path === pathname
    );

    // If route doesn't exist, redirect to 404
    if (!currentRoute) {
      router.push('/404');
      return;
    }

    // Public routes that don't require auth
    const publicRoutes = ['/404', '/unauthorized'];
    const authRoutes = ['/login', '/'];
    const isPublicRoute = publicRoutes.some(route =>
      pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    if (isAuthRoute) {
      // Redirect authenticated users away from login page
      if (isAuthenticated && user) {
        const defaultRoute = getDefaultRoute(user.role as UserRole);
        router.push(defaultRoute);
      }
      return;
    }

    if (isPublicRoute) {
      // Redirect authenticated users away from login page
      if (pathname === '/login' && isAuthenticated && user) {
        const defaultRoute = getDefaultRoute(user.role as UserRole);
        router.push(defaultRoute);
      }
      return;
    }

    // Check authentication for protected routes
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Check role-based access
    const userRole = user.role as UserRole;
    console.log('User Role:', userRole);
    if (!hasRouteAccess(pathname, userRole)) {
      // Redirect to user's default dashboard
      const defaultRoute = getDefaultRoute(userRole);
      router.push(defaultRoute);
      return;
    }
  }, [pathname, isAuthenticated, user, router, isInitialized]);

  // Show loading state while initializing auth
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For public routes or authorized access, render children
  const publicRoutes = ['/login', '/', '/404', '/unauthorized'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute || (isAuthenticated && user)) {
    return <>{children}</>;
  }

  // Show loading while redirecting
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
