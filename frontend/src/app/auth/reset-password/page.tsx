import { Suspense } from 'react';
import { PublicRoute, AuthPageLoader } from '@/components/auth';
import ResetPasswordForm from '@/features/auth/reset-password/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <PublicRoute>
      <Suspense fallback={<AuthPageLoader />}>
        <ResetPasswordForm />
      </Suspense>
    </PublicRoute>
  );
}