/**
 * Public Route Component
 * For auth pages (login, register, forgot-password)
 * Redirects authenticated users to the main course catalogue
 * 
 * Usage:
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { getLocaleFromPathname, localizePathname, DEFAULT_LOCALE } from '@/lib/locale';
import { AuthPageLoader } from './AuthPageLoader';

interface PublicRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * PublicRoute wrapper
 * Allows only unauthenticated users to access
 */
export function PublicRoute({ children, fallback }: PublicRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized } = useAuth();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;

  useEffect(() => {
    // Still initializing auth - wait
    if (!isInitialized) {
      return;
    }

    // Initialized and authenticated - redirect to the main catalogue
    if (isAuthenticated) {
      router.replace(localizePathname('/', activeLocale));
      return;
    }
  }, [activeLocale, isAuthenticated, isInitialized, router]);

  // Show loading state while initializing
  if (!isInitialized) {
    return fallback ?? <AuthPageLoader />;
  }

  // Already authenticated - show nothing (redirect happening)
  if (isAuthenticated) {
    return null;
  }

  // Not authenticated - render children
  return <>{children}</>;
}

export default PublicRoute;
