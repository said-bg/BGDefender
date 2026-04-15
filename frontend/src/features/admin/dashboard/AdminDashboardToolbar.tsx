import Link from 'next/link';
import styles from './AdminDashboardToolbar.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

type AdminDashboardToolbarProps = {
  t: AdminDashboardT;
};

export default function AdminDashboardToolbar({ t }: AdminDashboardToolbarProps) {
  return (
    <section
      className={styles.toolbar}
      aria-label={t('dashboard.toolbarLabel', { defaultValue: 'Admin actions' })}
    >
      <Link href="/admin/courses" className={styles.secondaryAction}>
        {t('manageCourses', { defaultValue: 'Open course library' })}
      </Link>
      <Link href="/admin/authors" className={styles.secondaryAction}>
        {t('manageAuthors', { defaultValue: 'Manage authors' })}
      </Link>
      <Link href="/admin/users" className={styles.secondaryAction}>
        {t('manageUsers', { defaultValue: 'Manage users' })}
      </Link>
      <Link href="/admin/resources" className={styles.secondaryAction}>
        {t('manageResources', { defaultValue: 'Manage resources' })}
      </Link>
      <Link href="/admin/collections" className={styles.secondaryAction}>
        {t('collections.title', { defaultValue: 'Manage collections' })}
      </Link>
    </section>
  );
}
