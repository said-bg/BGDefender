import Link from 'next/link';
import toolbarStyles from '@/features/admin/dashboard/AdminDashboardToolbar.module.css';
import type { AdminDashboardT } from '@/features/admin/dashboard/adminDashboard.types';

type CreatorDashboardToolbarProps = {
  t: AdminDashboardT;
};

export default function CreatorDashboardToolbar({
  t,
}: CreatorDashboardToolbarProps) {
  return (
    <section
      className={toolbarStyles.toolbar}
      aria-label={t('creatorDashboard.toolbarLabel')}
    >
      <Link href="/admin/courses" className={toolbarStyles.secondaryAction}>
        {t('manageCourses')}
      </Link>
      <Link href="/admin/courses/new" className={toolbarStyles.secondaryAction}>
        {t('createCourse')}
      </Link>
      <Link href="/admin/authors" className={toolbarStyles.secondaryAction}>
        {t('manageAuthors')}
      </Link>
    </section>
  );
}
