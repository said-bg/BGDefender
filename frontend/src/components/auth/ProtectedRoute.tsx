/**
 * Protected Route Component
 * Wrapper for pages that require authentication
 * 
 * Usage:
 * <ProtectedRoute>
 *   <YourPrivatePage />
 * </ProtectedRoute>
 * 
 * Features:
 * - Check if user is authenticated
 * - Show loading while auth initializes
 * - Redirect to login if not authenticated
 * - Optional role/permission checking
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import { AuthPageLoader } from './AuthPageLoader';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[]; // Optional: require specific roles
  fallback?: ReactNode; // Custom loading component
}

/**
 * ProtectedRoute wrapper
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, user } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    // Still initializing auth - wait
    if (!isInitialized) {
      return;
    }

    // Initialized but not authenticated - redirect to login
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role if required
    if (requiredRole && user && !requiredRole.includes(user.role)) {
      router.replace('/unauthorized');
      return;
    }
  }, [isAuthenticated, isInitialized, user, requiredRole, router, pathname]);

  // Show loading state while initializing
  if (!isInitialized) {
    return fallback ?? <AuthPageLoader />;
  }

  // Not authenticated - show nothing (redirect happening)
  if (!isAuthenticated) {
    return null;
  }

  // Role check failed - show nothing (redirect happening)
  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return null;
  }

  // Authenticated - render children
  return <>{children}</>;
}

export default ProtectedRoute;
