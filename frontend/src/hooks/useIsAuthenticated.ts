/**
 * useIsAuthenticated Hook
 * Check if user is authenticated
 * Returns both auth state and redirect helper
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface UseIsAuthenticatedOptions {
  redirectTo?: string;
}

export const useIsAuthenticated = (
  options: UseIsAuthenticatedOptions = {}
) => {
  const { redirectTo = '/login' } = options;
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const redirectToLogin = (customPath?: string) => {
    router.push(customPath || redirectTo);
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    redirectToLogin,
  };
};

export default useIsAuthenticated;
