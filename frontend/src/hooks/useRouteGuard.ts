'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { hasRouteAccess, getDefaultRoute, ROUTES } from '@/config/routes';
import type { UserRole } from '@/config/routes';

export const useRouteGuard = (requiredRoles?: UserRole[]) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Don't redirect during hydration
    if (typeof window === 'undefined') return;

    const currentRoute = Object.values(ROUTES).find(route => route.path === pathname);

    // If route doesn't exist, redirect to 404
    if (!currentRoute) {
      router.push('/404');
      return;
    }

    // If route doesn't require auth and no specific roles are required, allow access
    if (!currentRoute.requiresAuth && !requiredRoles) {
      // Redirect authenticated users away from login page
      if (pathname === '/login' && isAuthenticated && user) {
        const defaultRoute = getDefaultRoute(user.role as UserRole);
        router.push(defaultRoute);
      }
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Check role-based access
    const userRole = user.role as UserRole;
    const allowedRoles = requiredRoles || currentRoute.allowedRoles;

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // Redirect to user's default dashboard instead of showing unauthorized
      const defaultRoute = getDefaultRoute(userRole);
      router.push(defaultRoute);
      return;
    }

    // Check general route access
    if (!hasRouteAccess(pathname, userRole)) {
      const defaultRoute = getDefaultRoute(userRole);
      router.push(defaultRoute);
      return;
    }
  }, [pathname, isAuthenticated, user, router, requiredRoles]);

  return {
    isLoading: !isAuthenticated && pathname !== '/login',
    isAuthorized: isAuthenticated && user && (
      !requiredRoles || requiredRoles.includes(user.role as UserRole)
    ),
    user,
    isAuthenticated
  };
};