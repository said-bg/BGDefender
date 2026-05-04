'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/api';
import CourseMetrics from './CourseMetrics';
import CoursesSection from './CoursesSection';
import styles from './AdminCoursesPage.module.css';
import useAdminCourses from './useAdminCourses';

export default function AdminCoursesPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <AdminCoursesPageContent />
    </ProtectedRoute>
  );
}

function AdminCoursesPageContent() {
  const {
    actionError,
    actionMessage,
    actingCourseId,
    error,
    formatLevel,
    formatStatus,
    formatUpdatedAt,
    handleDeleteCourse,
    handleStatusChange,
    loading,
    localizedCourses,
    summary,
    t,
  } = useAdminCourses();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href="/admin" className={styles.backLink}>
            {t('backToOverview')}
          </Link>
          <p className={styles.eyebrow}>{t('coursesEyebrow')}</p>
          <h1 className={styles.title}>{t('coursesTitle')}</h1>
          <p className={styles.subtitle}>{t('coursesSubtitle')}</p>
        </div>

        <div className={styles.heroActions}>
          <Link href="/admin/courses/new" className={styles.primaryAction}>
            {t('createCourse')}
          </Link>
        </div>
      </section>

      <CourseMetrics summary={summary} t={t} />

      <CoursesSection
        actionError={actionError}
        actionMessage={actionMessage}
        actingCourseId={actingCourseId}
        courses={localizedCourses}
        error={error}
        formatLevel={formatLevel}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
        loading={loading}
        onDelete={(course) => void handleDeleteCourse(course)}
        onStatusChange={(course, nextStatus) => void handleStatusChange(course, nextStatus)}
        t={t}
      />
    </div>
  );
}
