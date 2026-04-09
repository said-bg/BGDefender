'use client';

import Link from 'next/link';
import { Course } from '@/services/courseService';
import { LocalizedAdminCourse } from './courseAdmin.utils';
import styles from './CourseCard.module.css';

type CourseCardProps = {
  actingCourseId: string | null;
  course: LocalizedAdminCourse;
  formatLevel: (level: Course['level']) => string;
  formatStatus: (status: Course['status']) => string;
  formatUpdatedAt: (updatedAt: string) => string;
  onDelete: (course: Course) => void;
  onStatusChange: (course: Course, nextStatus: 'draft' | 'published' | 'archived') => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function CourseCard({
  actingCourseId,
  course,
  formatLevel,
  formatStatus,
  formatUpdatedAt,
  onDelete,
  onStatusChange,
  t,
}: CourseCardProps) {
  const statusDotClass =
    course.status === 'published'
      ? styles.publishedDot
      : course.status === 'archived'
        ? styles.archivedDot
        : styles.draftDot;

  return (
    <article className={styles.courseCard}>
      <div className={styles.courseHeader}>
        <div className={styles.courseIdentity}>
          <span className={`${styles.statusDot} ${statusDotClass}`} />
          <div>
            <h3 className={styles.courseTitle}>{course.title}</h3>
            <p className={styles.courseAuthorLine}>
              {course.authorNames || t('noAuthors', { defaultValue: 'No authors assigned' })}
            </p>
          </div>
        </div>

        <div className={styles.badges}>
          <span
            className={`${styles.levelBadge} ${
              course.level === 'premium' ? styles.levelPremium : styles.levelFree
            }`}
          >
            {formatLevel(course.level)}
          </span>
          <span
            className={`${styles.statusBadge} ${
              course.status === 'published'
                ? styles.statusPublished
                : course.status === 'archived'
                  ? styles.statusArchived
                  : styles.statusDraft
            }`}
          >
            {formatStatus(course.status)}
          </span>
        </div>
      </div>

      <p className={styles.courseDescription} title={course.description || undefined}>
        {course.description ||
          t('noDescription', {
            defaultValue: 'No description added yet.',
          })}
      </p>

      <div className={styles.courseStats}>
        <span>
          {course.authorNames
            ? `${course.authors.length} ${t('authorsCount')}`
            : t('noAuthors', { defaultValue: 'No authors assigned' })}
        </span>
        <span>
          {course.chapterCount} {t('chaptersCount')}
        </span>
        <span>
          {course.lessonCount} {t('lessonsCount', { defaultValue: 'lessons' })}
        </span>
        <span>
          {t('updatedLabel', { defaultValue: 'Updated' })}: {formatUpdatedAt(course.updatedAt)}
        </span>
      </div>

      <div className={styles.courseActions}>
        <Link href={`/admin/courses/${course.id}/edit`} className={styles.editLink}>
          {t('editCourse', { defaultValue: 'Edit course' })}
        </Link>

        {course.status !== 'published' ? (
          <button
            type="button"
            className={styles.inlineAction}
            onClick={() => onStatusChange(course, 'published')}
            disabled={actingCourseId === course.id}
          >
            {t('courseActions.publish', { defaultValue: 'Publish' })}
          </button>
        ) : null}

        {course.status !== 'draft' ? (
          <button
            type="button"
            className={styles.inlineAction}
            onClick={() => onStatusChange(course, 'draft')}
            disabled={actingCourseId === course.id}
          >
            {t('courseActions.moveToDraft', { defaultValue: 'Move to draft' })}
          </button>
        ) : null}

        {course.status !== 'archived' ? (
          <button
            type="button"
            className={styles.inlineAction}
            onClick={() => onStatusChange(course, 'archived')}
            disabled={actingCourseId === course.id}
          >
            {t('courseActions.archive', { defaultValue: 'Archive' })}
          </button>
        ) : null}

        <button
          type="button"
          className={styles.inlineDanger}
          onClick={() => onDelete(course)}
          disabled={actingCourseId === course.id}
        >
          {actingCourseId === course.id
            ? t('courseActions.working', { defaultValue: 'Working...' })
            : t('courseActions.delete', { defaultValue: 'Delete' })}
        </button>
      </div>
    </article>
  );
}
