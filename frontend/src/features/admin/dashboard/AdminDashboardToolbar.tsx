import Link from 'next/link';
import styles from './AdminDashboardToolbar.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

type AdminDashboardToolbarProps = {
  t: AdminDashboardT;
};

export default function AdminDashboardToolbar({ t }: AdminDashboardToolbarProps) {
  return (
    <section className={styles.toolbar} aria-label={t('dashboard.toolbarLabel')}>
      <Link href="/admin/courses" className={styles.secondaryAction}>
        {t('manageCourses')}
      </Link>
      <Link href="/admin/authors" className={styles.secondaryAction}>
        {t('manageAuthors')}
      </Link>
      <Link href="/admin/users" className={styles.secondaryAction}>
        {t('manageUsers')}
      </Link>
      <Link href="/admin/resources" className={styles.secondaryAction}>
        {t('manageResources')}
      </Link>
      <Link href="/admin/collections" className={styles.secondaryAction}>
        {t('collections.title')}
      </Link>
    </section>
  );
}
