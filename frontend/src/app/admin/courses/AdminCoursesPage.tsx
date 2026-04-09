'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/api';
import CourseMetrics from '@/features/admin/courses/list/CourseMetrics';
import CoursesSection from '@/features/admin/courses/list/CoursesSection';
import styles from './AdminCoursesPage.module.css';
import useAdminCourses from '@/features/admin/courses/list/useAdminCourses';

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
            {t('backToOverview', { defaultValue: 'Back to dashboard' })}
          </Link>
          <p className={styles.eyebrow}>
            {t('coursesEyebrow', { defaultValue: 'Course library' })}
          </p>
          <h1 className={styles.title}>
            {t('coursesTitle', { defaultValue: 'Manage courses' })}
          </h1>
          <p className={styles.subtitle}>
            {t('coursesSubtitle', {
              defaultValue:
                'Create, review, and prepare courses before moving into chapters, subchapters, and content editing.',
            })}
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link href="/admin/courses/new" className={styles.primaryAction}>
            {t('createCourse', { defaultValue: 'Create course' })}
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
