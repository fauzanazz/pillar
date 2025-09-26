'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface SessionContextType {
  isLoading: boolean;
  isInitialized: boolean;
}

const SessionContext = createContext<SessionContextType>({
  isLoading: true,
  isInitialized: false,
});

export const useSession = () => useContext(SessionContext);

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const { getSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      if (isInitialized || typeof window === 'undefined') return;

      try {
        await getSession();
      } catch (error) {
        // Session initialization failed, but we continue
        console.warn('Session initialization failed:', error);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [getSession, isInitialized]);

  return (
    <SessionContext.Provider value={{ isLoading, isInitialized }}>
      {children}
    </SessionContext.Provider>
  );
};
