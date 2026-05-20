'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  localizePathname,
} from '@/lib/locale';
import toolbarStyles from '@/features/admin/dashboard/AdminDashboardToolbar.module.css';
import type { AdminDashboardT } from '@/features/admin/dashboard/adminDashboard.types';

type CreatorDashboardToolbarProps = {
  t: AdminDashboardT;
};

export default function CreatorDashboardToolbar({
  t,
}: CreatorDashboardToolbarProps) {
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;

  return (
    <section
      className={toolbarStyles.toolbar}
      aria-label={t('creatorDashboard.toolbarLabel')}
    >
      <Link
        href={localizePathname('/admin/courses', activeLocale)}
        className={toolbarStyles.secondaryAction}
      >
        {t('manageCourses')}
      </Link>
      <Link
        href={localizePathname('/admin/courses/new', activeLocale)}
        className={toolbarStyles.secondaryAction}
      >
        {t('createCourse')}
      </Link>
      <Link
        href={localizePathname('/admin/authors', activeLocale)}
        className={toolbarStyles.secondaryAction}
      >
        {t('manageAuthors')}
      </Link>
    </section>
  );
}
