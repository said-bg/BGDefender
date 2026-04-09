import { Suspense } from 'react';
import { PublicRoute, AuthPageLoader } from '@/components/auth';
import ForgotPasswordForm from '@/features/auth/forgot-password/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <PublicRoute>
      <Suspense fallback={<AuthPageLoader />}>
        <ForgotPasswordForm />
      </Suspense>
    </PublicRoute>
  );
}