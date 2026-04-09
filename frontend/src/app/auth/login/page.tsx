import { Suspense } from 'react';
import { PublicRoute, AuthPageLoader } from '@/components/auth';
import LoginForm from '@/features/auth/login/LoginForm';

export default function LoginPage() {
  return (
    <PublicRoute>
      <Suspense fallback={<AuthPageLoader />}>
        <LoginForm />
      </Suspense>
    </PublicRoute>
  );
}