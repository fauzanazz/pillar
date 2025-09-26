import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_USERS, LOGIN_CREDENTIALS, DASHBOARD_ROUTES, User } from '@/constants/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        // Find matching credentials
        const credentials = LOGIN_CREDENTIALS.find(
          cred => cred.username === username && cred.password === password
        );

        if (!credentials) {
          return { success: false, error: 'Invalid username or password' };
        }

        // Find the user data
        const user = MOCK_USERS.find(u => u.email === credentials.email);

        if (!user) {
          return { success: false, error: 'User not found' };
        }

        // Set authenticated state
        set({
          user,
          isAuthenticated: true,
        });

        // Return success with redirect URL based on role
        const redirectUrl = DASHBOARD_ROUTES[user.role];
        return { success: true, redirectUrl };
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
    }),
    {
      name: 'auth-storage',
    }
  )
);