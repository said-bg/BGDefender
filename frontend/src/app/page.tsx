'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthPageLoader } from '@/components/auth';
import HomePage from '@/features/home/HomePage';
import { useAuth } from '@/hooks';
import { DEFAULT_LOCALE, getLocaleFromPathname, localizePathname } from '@/lib/locale';
import { UserRole } from '@/types/api';

export default function RootPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;

  useEffect(() => {
    if (!isInitialized || !isAdmin) {
      return;
    }

    router.replace(localizePathname('/admin', activeLocale));
  }, [activeLocale, isAdmin, isInitialized, router]);

  if (!isInitialized || isAdmin) {
    return <AuthPageLoader />;
  }

  return <HomePage />;
}
