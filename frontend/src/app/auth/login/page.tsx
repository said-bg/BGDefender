/**
 * Login Page
 */

import { Suspense } from 'react';
import { PublicRoute, AuthPageLoader } from '@/components/auth';
import { LoginForm } from './LoginForm';

/**
 * Login page with PublicRoute wrapper
 * Only accessible to unauthenticated users
 */
export default function LoginPage() {
  return (
    <PublicRoute>
      <Suspense fallback={<AuthPageLoader />}>
        <LoginForm />
      </Suspense>
    </PublicRoute>
  );
}
