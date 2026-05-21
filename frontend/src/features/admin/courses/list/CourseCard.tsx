'use client';

import Link from 'next/link';
import { buildCoursePreviewHref } from '@/features/admin/courses/edit-course/shared/coursePreview.utils';
import { getActorName } from '@/features/admin/dashboard/adminDashboard.utils';
import { localizePathname, type AppLocale } from '@/lib/locale';
import { Course } from '@/services/course';
import { LocalizedAdminCourse } from './courseAdmin.utils';
import styles from './CourseCard.module.css';

type CourseCardProps = {
  actingCourseId: string | null;
  course: LocalizedAdminCourse;
  formatAuditDateTime: (value: string) => string;
  formatLevel: (level: Course['level']) => string;
  formatStatus: (status: Course['status']) => string;
  formatUpdatedAt: (updatedAt: string) => string;
  onDelete: (course: Course) => void;
  onStatusChange: (course: Course, nextStatus: 'draft' | 'published') => void;
  showLearningSummary: boolean;
  showOwner: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  activeLocale: AppLocale;
};

export default function CourseCard({
  actingCourseId,
  course,
  formatAuditDateTime,
  formatLevel,
  formatStatus,
  formatUpdatedAt,
  onDelete,
  onStatusChange,
  showLearningSummary,
  showOwner,
  t,
  activeLocale,
}: CourseCardProps) {
  const statusDotClass =
    course.status === 'published' ? styles.publishedDot : styles.draftDot;
  const ownerName = getActorName(course.owner, t('reviewOwnerUnknown'));
  const createdByActor = course.createdBy ?? course.owner ?? null;
  const lastEditedByActor =
    course.lastEditedBy ?? course.publishedBy ?? course.createdBy ?? course.owner ?? null;
  const publishedByActor =
    course.publishedBy ?? course.lastEditedBy ?? course.createdBy ?? course.owner ?? null;
  const createdByName = getActorName(createdByActor, t('auditUnknown'));
  const lastEditedByName = getActorName(lastEditedByActor, t('auditUnknown'));
  const publishedByName = getActorName(publishedByActor, t('auditUnknown'));
  const learningSummary = course.learningSummary;
  const hasLearningActivity =
    learningSummary &&
    (learningSummary.startedLearners > 0 ||
      learningSummary.completedLearners > 0 ||
      learningSummary.averageProgress !== null ||
      learningSummary.finalTestAttempts > 0);

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
            {showOwner ? (
              <p className={styles.courseOwnerLine}>
                {t('reviewOwnerLabel', { owner: ownerName })}
              </p>
            ) : null}
            <p className={styles.courseOwnerLine}>
              {t('auditCreatedByLabel', { actor: createdByName })}
            </p>
            <p className={styles.courseOwnerLine}>
              {t('auditLastEditedByLabel', {
                actor: lastEditedByName,
                date: formatAuditDateTime(course.updatedAt),
              })}
            </p>
            {course.publishedAt ? (
              <p className={styles.courseOwnerLine}>
                {t('auditPublishedByLabel', {
                  actor: publishedByName,
                  date: formatAuditDateTime(course.publishedAt),
                })}
              </p>
            ) : null}
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

      {showLearningSummary ? (
        <div className={styles.courseLearningStats}>
          {hasLearningActivity && learningSummary ? (
            <>
              <span>
                {t('courseLearning.startedLearners', {
                  count: learningSummary.startedLearners,
                })}
              </span>
              <span>
                {t('courseLearning.completedLearners', {
                  count: learningSummary.completedLearners,
                })}
              </span>
              <span>
                {t('courseLearning.averageProgress', {
                  value:
                    learningSummary.averageProgress === null
                      ? t('courseLearning.noAverageProgress')
                      : `${learningSummary.averageProgress}%`,
                })}
              </span>
              <span>
                {t('courseLearning.finalTestPassRate', {
                  value:
                    learningSummary.finalTestPassRate === null
                      ? t('courseLearning.noFinalTestPassRate')
                      : `${learningSummary.finalTestPassRate}%`,
                  count: learningSummary.finalTestAttempts,
                })}
              </span>
            </>
          ) : (
            <span>{t('courseLearning.empty')}</span>
          )}
        </div>
      ) : null}

      <div className={styles.courseActions}>
        <Link
          href={localizePathname(`/admin/courses/${course.id}/edit`, activeLocale)}
          className={styles.editLink}
        >
          {t('editCourse')}
        </Link>

        <Link
          href={localizePathname(`/admin/courses/${course.id}/analytics`, activeLocale)}
          className={styles.inlineActionLink}
        >
          {t('courseActions.analytics')}
        </Link>

        <Link
          href={buildCoursePreviewHref(course.id, {
            returnTo: localizePathname('/admin/courses', activeLocale),
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

