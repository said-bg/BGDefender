'use client';

import Link from 'next/link';
import { buildCoursePreviewHref } from '@/features/admin/courses/edit-course/shared/coursePreview.utils';
import { Course } from '@/services/course';
import { LocalizedAdminCourse } from './courseAdmin.utils';
import styles from './CourseCard.module.css';

type CourseCardProps = {
  actingCourseId: string | null;
  course: LocalizedAdminCourse;
  formatLevel: (level: Course['level']) => string;
  formatStatus: (status: Course['status']) => string;
  formatUpdatedAt: (updatedAt: string) => string;
  onDelete: (course: Course) => void;
  onStatusChange: (course: Course, nextStatus: 'draft' | 'published') => void;
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
    course.status === 'published' ? styles.publishedDot : styles.draftDot;

  return (
    <article className={styles.courseCard}>
      <div className={styles.courseHeader}>
        <div className={styles.courseIdentity}>
          <span className={`${styles.statusDot} ${statusDotClass}`} />
          <div>
            <h3 className={styles.courseTitle}>{course.title}</h3>
            <p className={styles.courseAuthorLine}>
              {course.authorNames || t('noAuthors')}
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
                : styles.statusDraft
            }`}
          >
            {formatStatus(course.status)}
          </span>
        </div>
      </div>

      <p className={styles.courseDescription} title={course.description || undefined}>
        {course.description || t('noDescription')}
      </p>

      <div className={styles.courseStats}>
        <span>
          {course.authorNames
            ? `${course.authors.length} ${t('authorsCount')}`
            : t('noAuthors')}
        </span>
        <span>
          {course.chapterCount} {t('chaptersCount')}
        </span>
        <span>
          {course.lessonCount} {t('lessonsCount')}
        </span>
        <span>
          {t('updatedLabel')}: {formatUpdatedAt(course.updatedAt)}
        </span>
      </div>

      <div className={styles.courseActions}>
        <Link href={`/admin/courses/${course.id}/edit`} className={styles.editLink}>
          {t('editCourse')}
        </Link>

        <Link
          href={buildCoursePreviewHref(course.id, {
            returnTo: '/admin/courses',
          })}
          className={styles.inlineActionLink}
        >
          {t('courseActions.preview')}
        </Link>

        {course.status !== 'published' ? (
          <button
            type="button"
            className={styles.inlineAction}
            onClick={() => onStatusChange(course, 'published')}
            disabled={actingCourseId === course.id}
          >
            {t('courseActions.publish')}
          </button>
        ) : null}

        {course.status !== 'draft' ? (
          <button
            type="button"
            className={styles.inlineAction}
            onClick={() => onStatusChange(course, 'draft')}
            disabled={actingCourseId === course.id}
          >
            {t('courseActions.moveToDraft')}
          </button>
        ) : null}

        <button
          type="button"
          className={styles.inlineDanger}
          onClick={() => onDelete(course)}
          disabled={actingCourseId === course.id}
        >
          {actingCourseId === course.id
            ? t('courseActions.working')
            : t('courseActions.delete')}
        </button>
      </div>
    </article>
  );
}

