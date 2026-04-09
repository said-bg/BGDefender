'use client';

import { Course } from '@/services/courseService';
import CourseCard from './CourseCard';
import { LocalizedAdminCourse } from './courseAdmin.utils';
import styles from './CoursesSection.module.css';

type CoursesSectionProps = {
  actionError: string | null;
  actionMessage: string | null;
  actingCourseId: string | null;
  courses: LocalizedAdminCourse[];
  formatLevel: (level: Course['level']) => string;
  formatStatus: (status: Course['status']) => string;
  formatUpdatedAt: (updatedAt: string) => string;
  loading: boolean;
  error: string | null;
  onDelete: (course: Course) => void;
  onStatusChange: (course: Course, nextStatus: 'draft' | 'published' | 'archived') => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function CoursesSection({
  actionError,
  actionMessage,
  actingCourseId,
  courses,
  formatLevel,
  formatStatus,
  formatUpdatedAt,
  loading,
  error,
  onDelete,
  onStatusChange,
  t,
}: CoursesSectionProps) {
  if (loading) {
    return (
      <section className={styles.section}>
        <p className={styles.statusMessage}>{t('loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.section}>
        <p className={styles.errorMessage}>{error}</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>
            {t('coursesListTitle', { defaultValue: 'All courses' })}
          </h2>
          <p className={styles.sectionDescription}>
            {t('coursesListDescription', {
              defaultValue:
                'A simple view of every course, with its status, access level, authors, and structure size.',
            })}
          </p>
        </div>
      </div>

      {actionMessage ? <p className={styles.successMessage}>{actionMessage}</p> : null}
      {actionError ? <p className={styles.errorMessage}>{actionError}</p> : null}

      {courses.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>
            {t('emptyCoursesTitle', { defaultValue: 'No courses yet' })}
          </h3>
          <p className={styles.emptyDescription}>
            {t('emptyCoursesDescription', {
              defaultValue: 'As soon as courses exist, they will appear here for admin review.',
            })}
          </p>
        </div>
      ) : (
        <div className={styles.courseList}>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              actingCourseId={actingCourseId}
              course={course}
              formatLevel={formatLevel}
              formatStatus={formatStatus}
              formatUpdatedAt={formatUpdatedAt}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}
