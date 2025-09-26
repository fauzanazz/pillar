'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { getNavigationRoutes, hasRouteAccess } from '@/config/routes';
import type { UserRole } from '@/config/routes';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasAccess,
    getDefaultDashboard,
  } = useAuthStore();

  const router = useRouter();

  // Enhanced logout that redirects to login
  const signOut = () => {
    logout();
    router.push('/login');
  };

  // Navigate to user's default dashboard
  const goToDashboard = () => {
    const defaultDashboard = getDefaultDashboard();
    if (defaultDashboard) {
      router.push(defaultDashboard);
    } else {
      router.push('/login');
    }
  };

  // Get navigation routes for current user
  const getNavRoutes = () => {
    if (!user) return [];
    return getNavigationRoutes(user.role as UserRole);
  };

  // Check if current user can access a specific route
  const canAccess = (route: string) => {
    if (!user) return false;
    return hasRouteAccess(route, user.role as UserRole);
  };

  // Get user role with type safety
  const userRole = user?.role as UserRole | undefined;

  // Check if user has specific role
  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.role as UserRole) : false;
  };

  return {
    // User data
    user,
    userRole,
    isAuthenticated,

    // Auth actions
    login,
    logout: signOut,
    updateUser,

    // Route utilities
    hasAccess,
    canAccess,
    getDefaultDashboard,
    goToDashboard,
    getNavRoutes,

    // Role utilities
    hasRole,
    hasAnyRole,

    // Convenient role checks
    isLegal: hasRole('legal'),
    isInternal: hasRole('internal'),
    isManagement: hasRole('management'),

    // Permission helpers
    canManageUsers: hasRole('management'),
    canCreateContracts: hasRole('internal'),
    canReviewContracts: hasAnyRole(['legal', 'management']),
    canViewReports: hasAnyRole(['legal', 'management']),
    canAccessSettings: hasRole('management'),
  };
};