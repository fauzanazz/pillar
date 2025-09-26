import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_USERS, LOGIN_CREDENTIALS, User } from '@/constants/mockData';
import { getDefaultRoute, hasRouteAccess } from '@/config/routes';
import type { UserRole } from '@/config/routes';
import { authApi } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  initializeAuth: () => void;
  hasAccess: (route: string) => boolean;
  getDefaultDashboard: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          // Try API call first when backend is ready
          const response = await authApi.login(email, password);

          if (!response) {
            return { success: false, error: 'Invalid credentials' };
          }

          const session = await authApi.getSession();

          if (!session) {
            return { success: false, error: 'User not found' };
          }

          // Set authenticated state
          set({
            user: session.user,
            isAuthenticated: true,
          });

          // Return success with redirect URL based on role
          const redirectUrl = getDefaultRoute(session.user.role as UserRole);
          return { success: true, redirectUrl };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error: 'Login failed. Please try again.' };
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      initializeAuth: () => {
        // This is called on app initialization
        // Zustand persist middleware handles restoration
      },

      hasAccess: (route: string) => {
        const { user } = get();
        if (!user) return false;
        return hasRouteAccess(route, user.role as UserRole);
      },

      getDefaultDashboard: () => {
        const { user } = get();
        if (!user) return null;
        return getDefaultRoute(user.role as UserRole);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
