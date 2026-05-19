'use client';

import { Course } from '@/services/course';
import CourseCard from './CourseCard';
import { LocalizedAdminCourse } from './courseAdmin.utils';
import styles from './CoursesSection.module.css';

type CoursesSectionProps = {
  actionError: string | null;
  actionMessage: string | null;
  actingCourseId: string | null;
  courses: LocalizedAdminCourse[];
  emptyDescription: string;
  emptyTitle: string;
  formatLevel: (level: Course['level']) => string;
  formatStatus: (status: Course['status']) => string;
  formatUpdatedAt: (updatedAt: string) => string;
  loading: boolean;
  error: string | null;
  onDelete: (course: Course) => void;
  onStatusChange: (course: Course, nextStatus: 'draft' | 'published') => void;
  showLearningSummary: boolean;
  sectionDescription: string;
  sectionTitle: string;
  showOwner: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function CoursesSection({
  actionError,
  actionMessage,
  actingCourseId,
  courses,
  emptyDescription,
  emptyTitle,
  formatLevel,
  formatStatus,
  formatUpdatedAt,
  loading,
  error,
  onDelete,
  onStatusChange,
  showLearningSummary,
  sectionDescription,
  sectionTitle,
  showOwner,
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
          <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
          <p className={styles.sectionDescription}>{sectionDescription}</p>
        </div>
      </div>

      {actionMessage ? <p className={styles.successMessage}>{actionMessage}</p> : null}
      {actionError ? <p className={styles.errorMessage}>{actionError}</p> : null}

      {courses.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>{emptyTitle}</h3>
          <p className={styles.emptyDescription}>{emptyDescription}</p>
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
              showLearningSummary={showLearningSummary}
              showOwner={showOwner}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}

