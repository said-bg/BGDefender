'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DEFAULT_LOCALE, getLocaleFromPathname, localizePathname } from '@/lib/locale';
import type { Course } from '@/services/course';
import { UserRole } from '@/types/api';
import { buildCoursePreviewHref } from './coursePreview.utils';
import formStyles from './EditCourseForm.module.css';
import sharedStyles from './EditCoursePage.module.css';
import shellStyles from './EditCourseShell.module.css';

export type EditCourseSection =
  | 'analytics'
  | 'details'
  | 'structure'
  | 'content'
  | 'quiz'
  | 'final-test';

export const getEditCourseHref = (
  courseId: string,
  section: EditCourseSection,
) => {
  if (section === 'analytics') {
    return `/admin/courses/${courseId}/analytics`;
  }

  if (section === 'structure') {
    return `/admin/courses/${courseId}/edit/structure`;
  }

  if (section === 'content') {
    return `/admin/courses/${courseId}/edit/content`;
  }

  if (section === 'quiz') {
    return `/admin/courses/${courseId}/edit/quiz`;
  }

  if (section === 'final-test') {
    return `/admin/courses/${courseId}/edit/final-test`;
  }

  return `/admin/courses/${courseId}/edit`;
};

export const useEditCourseId = () => {
  const params = useParams<{ courseId: string | string[] }>();
  return Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;
};

type EditCourseShellProps = {
  courseId: string;
  section: EditCourseSection;
  title: string;
  subtitle: string;
  course?: Course | null;
  courseTitle?: string;
  actions?: ReactNode;
  previewHref?: string;
  wide?: boolean;
  children: ReactNode;
};

export function EditCourseProtected({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.CREATOR]}>
      {children}
    </ProtectedRoute>
  );
}

export function EditCourseShell({
  courseId,
  section,
  title,
  subtitle,
  course,
  courseTitle,
  actions,
  previewHref,
  wide = false,
  children,
}: EditCourseShellProps) {
  const { t } = useTranslation('admin');
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;
  const resolvedPreviewHref =
    previewHref ??
    buildCoursePreviewHref(courseId, {
      returnTo: localizePathname(getEditCourseHref(courseId, section), activeLocale),
    });
  const ownerName = course?.owner
    ? `${course.owner.firstName || ''} ${course.owner.lastName || ''}`.trim() ||
      course.owner.email
    : null;
  const learningSummary = course?.learningSummary ?? null;
  const hasLearningSummary =
    learningSummary &&
    (learningSummary.startedLearners > 0 ||
      learningSummary.completedLearners > 0 ||
      learningSummary.averageProgress !== null ||
      learningSummary.finalTestAttempts > 0);

  const tabs: Array<{ key: EditCourseSection; label: string }> = [
    {
      key: 'analytics',
      label: t('edit.tabs.analytics'),
    },
    {
      key: 'details',
      label: t('edit.tabs.details'),
    },
    {
      key: 'structure',
      label: t('edit.tabs.structure'),
    },
    {
      key: 'content',
      label: t('edit.tabs.content'),
    },
    {
      key: 'quiz',
      label: t('edit.tabs.quiz'),
    },
    {
      key: 'final-test',
      label: t('edit.tabs.finalTest'),
    },
  ];

  return (
    <div className={`${shellStyles.page} ${wide ? shellStyles.pageWide : ''}`}>
      <section className={shellStyles.hero}>
        <div className={shellStyles.heroCopy}>
          <Link
            href={localizePathname('/admin/courses', activeLocale)}
            className={shellStyles.backLink}
          >
            {t('edit.backToCourses')}
          </Link>
          <p className={shellStyles.eyebrow}>{t('edit.eyebrow')}</p>
          <h1 className={shellStyles.title}>{title}</h1>
          {subtitle ? <p className={shellStyles.subtitle}>{subtitle}</p> : null}
          {courseTitle ? <p className={sharedStyles.helperText}>{courseTitle}</p> : null}
          {ownerName || learningSummary ? (
            <div className={shellStyles.contextChips}>
              {ownerName ? (
                <span className={shellStyles.contextChip}>
                  {t('reviewOwnerLabel', { owner: ownerName })}
                </span>
              ) : null}

              {learningSummary ? (
                hasLearningSummary ? (
                  <>
                    <span className={shellStyles.contextChip}>
                      {t('courseLearning.startedLearners', {
                        count: learningSummary.startedLearners,
                      })}
                    </span>
                    <span className={shellStyles.contextChip}>
                      {t('courseLearning.completedLearners', {
                        count: learningSummary.completedLearners,
                      })}
                    </span>
                    <span className={shellStyles.contextChip}>
                      {t('courseLearning.averageProgress', {
                        value:
                          learningSummary.averageProgress === null
                            ? t('courseLearning.noAverageProgress')
                            : `${learningSummary.averageProgress}%`,
                      })}
                    </span>
                    <span className={shellStyles.contextChip}>
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
                  <span className={shellStyles.contextChip}>
                    {t('courseLearning.empty')}
                  </span>
                )
              ) : null}
            </div>
          ) : null}

          <div className={shellStyles.sectionNavRow}>
            <nav className={shellStyles.sectionNav} aria-label={t('edit.courseSection')}>
              {tabs.map((tab) => (
                <Link
                  key={tab.key}
                  href={localizePathname(getEditCourseHref(courseId, tab.key), activeLocale)}
                  className={`${shellStyles.sectionNavLink} ${
                    section === tab.key ? shellStyles.sectionNavLinkActive : ''
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>

            <div className={shellStyles.sectionActions}>
              <Link
                href={resolvedPreviewHref}
                className={`${shellStyles.sectionNavLink} ${shellStyles.previewLink}`}
              >
                {t('edit.preview')}
              </Link>

              {actions}
            </div>
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}

export function EditCourseLoadingState() {
  const { t } = useTranslation('admin');

  return (
    <div className={shellStyles.page}>
      <section className={formStyles.formCard}>
        <p className={sharedStyles.helperMessage}>{t('loading')}</p>
      </section>
    </div>
  );
}

export function EditCourseErrorState({ message }: { message: string }) {
  const { t } = useTranslation('admin');
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;

  return (
    <div className={shellStyles.page}>
      <section className={formStyles.formCard}>
        <p className={sharedStyles.errorMessage}>{message}</p>
        <div className={sharedStyles.actions}>
          <Link
            href={localizePathname('/admin/courses', activeLocale)}
            className={sharedStyles.secondaryAction}
          >
            {t('backToOverview')}
          </Link>
        </div>
      </section>
    </div>
  );
}







