'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  localizePathname,
} from '@/lib/locale';
import styles from './AdminDashboardToolbar.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

type AdminDashboardToolbarProps = {
  t: AdminDashboardT;
};

export default function AdminDashboardToolbar({ t }: AdminDashboardToolbarProps) {
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;

  return (
    <section className={styles.toolbar} aria-label={t('dashboard.toolbarLabel')}>
      <Link
        href={localizePathname('/admin/courses', activeLocale)}
        className={styles.secondaryAction}
      >
        {t('manageCourses')}
      </Link>
      <Link
        href={localizePathname('/admin/authors', activeLocale)}
        className={styles.secondaryAction}
      >
        {t('manageAuthors')}
      </Link>
      <Link
        href={localizePathname('/admin/users', activeLocale)}
        className={styles.secondaryAction}
      >
        {t('manageUsers')}
      </Link>
      <Link
        href={localizePathname('/admin/resources', activeLocale)}
        className={styles.secondaryAction}
      >
        {t('manageResources')}
      </Link>
      <Link
        href={localizePathname('/admin/certificate-signers', activeLocale)}
        className={styles.secondaryAction}
      >
        {t('signers.title')}
      </Link>
      <Link
        href={localizePathname('/admin/collections', activeLocale)}
        className={styles.secondaryAction}
      >
        {t('collections.title')}
      </Link>
    </section>
  );
}
