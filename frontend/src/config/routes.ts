export type UserRole = 'legal' | 'internal' | 'management';

export interface RouteConfig {
  path: string;
  name: string;
  component?: string;
  allowedRoles: UserRole[];
  requiresAuth: boolean;
  icon?: string;
  description?: string;
  children?: RouteConfig[];
}

// Define all application routes with role-based access
export const ROUTES: Record<string, RouteConfig> = {
  // Public routes
  LOGIN: {
    path: '/login',
    name: 'Login',
    allowedRoles: [],
    requiresAuth: false,
    description: 'User authentication page'
  },

  HOME: {
    path: '/',
    name: 'Home',
    allowedRoles: [],
    requiresAuth: false,
    description: 'Landing page'
  },

  // Protected dashboard routes
  LEGAL_DASHBOARD: {
    path: '/legal',
    name: 'Legal Dashboard',
    allowedRoles: ['legal'],
    requiresAuth: true,
    icon: 'Shield',
    description: 'Legal team contract review and compliance dashboard'
  },

  INTERNAL_DASHBOARD: {
    path: '/internal',
    name: 'Internal Dashboard',
    allowedRoles: ['internal'],
    requiresAuth: true,
    icon: 'FileText',
    description: 'Internal team contract management dashboard'
  },

  MANAGEMENT_DASHBOARD: {
    path: '/management',
    name: 'Management Dashboard',
    allowedRoles: ['management'],
    requiresAuth: true,
    icon: 'Users',
    description: 'Management oversight and strategic dashboard'
  },

  // Contract management routes (role-specific access)
  CONTRACTS_LIST: {
    path: '/contracts',
    name: 'Contracts',
    allowedRoles: ['legal', 'internal', 'management'],
    requiresAuth: true,
    icon: 'FileText',
    description: 'Contract listing and management'
  },

  CONTRACT_CREATE: {
    path: '/contracts/create',
    name: 'Create Contract',
    allowedRoles: ['internal'],
    requiresAuth: true,
    description: 'Create new contract'
  },

  CONTRACT_EDIT: {
    path: '/contracts/:id/edit',
    name: 'Edit Contract',
    allowedRoles: ['internal'],
    requiresAuth: true,
    description: 'Edit existing contract'
  },

  CONTRACT_VIEW: {
    path: '/contracts/:id',
    name: 'View Contract',
    allowedRoles: ['legal', 'internal', 'management'],
    requiresAuth: true,
    description: 'View contract details'
  },

  CONTRACT_REVIEW: {
    path: '/contracts/:id/review',
    name: 'Review Contract',
    allowedRoles: ['legal', 'management'],
    requiresAuth: true,
    description: 'Review and approve/reject contracts'
  },

  // User management routes (limited access)
  USERS_LIST: {
    path: '/users',
    name: 'Users',
    allowedRoles: ['management'],
    requiresAuth: true,
    icon: 'Users',
    description: 'User management and administration'
  },

  USER_PROFILE: {
    path: '/profile',
    name: 'Profile',
    allowedRoles: ['legal', 'internal', 'management'],
    requiresAuth: true,
    icon: 'User',
    description: 'User profile and settings'
  },

  // Reports and analytics (role-specific)
  REPORTS: {
    path: '/reports',
    name: 'Reports',
    allowedRoles: ['legal', 'management'],
    requiresAuth: true,
    icon: 'BarChart',
    description: 'Analytics and reporting dashboard',
    children: [
      {
        path: '/reports/legal',
        name: 'Legal Reports',
        allowedRoles: ['legal'],
        requiresAuth: true,
        description: 'Legal compliance and review reports'
      },
      {
        path: '/reports/financial',
        name: 'Financial Reports',
        allowedRoles: ['management'],
        requiresAuth: true,
        description: 'Contract value and financial analytics'
      }
    ]
  },

  // Settings and configuration
  SETTINGS: {
    path: '/settings',
    name: 'Settings',
    allowedRoles: ['management'],
    requiresAuth: true,
    icon: 'Settings',
    description: 'System settings and configuration'
  },

  // Error pages
  NOT_FOUND: {
    path: '/404',
    name: 'Not Found',
    allowedRoles: [],
    requiresAuth: false,
    description: '404 error page'
  },

  UNAUTHORIZED: {
    path: '/unauthorized',
    name: 'Unauthorized',
    allowedRoles: [],
    requiresAuth: false,
    description: '403 unauthorized access page'
  }
};

// Role-based default dashboard mapping
export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  legal: ROUTES.LEGAL_DASHBOARD.path,
  internal: ROUTES.INTERNAL_DASHBOARD.path,
  management: ROUTES.MANAGEMENT_DASHBOARD.path
};

// Get routes accessible by a specific role
export const getRoutesForRole = (role: UserRole): RouteConfig[] => {
  return Object.values(ROUTES).filter(route =>
    route.allowedRoles.length === 0 || route.allowedRoles.includes(role)
  );
};

// Get navigation routes (main dashboard routes only)
export const getNavigationRoutes = (role: UserRole): RouteConfig[] => {
  const dashboardRoutes = [
    ROUTES.LEGAL_DASHBOARD,
    ROUTES.INTERNAL_DASHBOARD,
    ROUTES.MANAGEMENT_DASHBOARD,
    ROUTES.CONTRACTS_LIST,
    ROUTES.USERS_LIST,
    ROUTES.REPORTS,
    ROUTES.USER_PROFILE,
    ROUTES.SETTINGS
  ];

  return dashboardRoutes.filter(route =>
    route.allowedRoles.includes(role)
  );
};

// Check if user has access to a specific route
export const hasRouteAccess = (route: string, userRole?: UserRole): boolean => {
  const routeConfig = Object.values(ROUTES).find(r => r.path === route);

  if (!routeConfig) return false;

  // Public routes (no auth required)
  if (!routeConfig.requiresAuth) return true;

  // Protected routes require role check
  if (!userRole) return false;

  return routeConfig.allowedRoles.includes(userRole);
};

// Get default route for user role
export const getDefaultRoute = (role: UserRole): string => {
  return ROLE_DEFAULT_ROUTES[role];
};

export default ROUTES;