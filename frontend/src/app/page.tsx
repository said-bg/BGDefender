'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthPageLoader } from '@/components/auth';
import HomePage from '@/features/home/HomePage';
import { useAuth } from '@/hooks';
import { UserRole } from '@/types/api';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!isInitialized || !isAdmin) {
      return;
    }

    router.replace('/admin');
  }, [isAdmin, isInitialized, router]);

  if (!isInitialized || isAdmin) {
    return <AuthPageLoader />;
  }

  return <HomePage />;
}
