/**
 * Auth Initializer Component
 * Initializes auth on app startup
 * 
 * Wraps the app to check if user is logged in on page load
 * This is needed for:
 * - Persisting auth after page refresh
 * - Hydrating auth state from localStorage
 * - Checking token validity
 */

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider - Initialize auth on app startup
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Run auth initialization on mount
    initializeAuth().catch((err) => {
      console.error('Auth initialization error:', err);
    });
  }, [initializeAuth]);

  return <>{children}</>;
}

export default AuthProvider;
