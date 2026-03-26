/**
 * Forgot Password Page
 */

import { PublicRoute } from '@/components/auth';
import { ForgotPasswordForm } from './ForgotPasswordForm';

/**
 * Forgot Password page with PublicRoute wrapper
 * Only accessible to unauthenticated users
 */
export default function ForgotPasswordPage() {
  return (
    <PublicRoute>
      <ForgotPasswordForm />
    </PublicRoute>
  );
}
