/**
 * Register Page
 */

import { Suspense } from 'react';
import { PublicRoute, AuthPageLoader } from '@/components/auth';
import { RegisterForm } from './RegisterForm';

/**
 * Register page with PublicRoute wrapper
 * Only accessible to unauthenticated users
 */
export default function RegisterPage() {
  return (
    <PublicRoute>
      <Suspense fallback={<AuthPageLoader />}>
        <RegisterForm />
      </Suspense>
    </PublicRoute>
  );
}
