/**
 * Reset Password Page
 */

import { Suspense } from 'react';
import { PublicRoute, AuthPageLoader } from '@/components/auth';
import { ResetPasswordForm } from './ResetPasswordForm';

/**
 * Reset Password page with PublicRoute wrapper
 * Only accessible to unauthenticated users
 * Token is passed via URL query parameter: ?token=<reset_token>
 */
export default function ResetPasswordPage() {
  return (
    <PublicRoute>
      <Suspense fallback={<AuthPageLoader />}>
        <ResetPasswordForm />
      </Suspense>
    </PublicRoute>
  );
}
