'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks';
import { DEFAULT_LOCALE, getLocaleFromPathname, localizePathname } from '@/lib/locale';
import type { CourseManagementScope } from '@/services/course';
import { UserRole } from '@/types/api';
import CourseMetrics from './CourseMetrics';
import CoursesSection from './CoursesSection';
import styles from './AdminCoursesPage.module.css';
import useAdminCourses from './useAdminCourses';

export default function AdminCoursesPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.CREATOR]}>
      <AdminCoursesPageContent />
    </ProtectedRoute>
  );
}

function AdminCoursesPageContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;
  const effectiveScope: CourseManagementScope =
    user?.role === UserRole.ADMIN && searchParams.get('scope') === 'review'
      ? 'review'
      : 'mine';
  const backHref = localizePathname(
    user?.role === UserRole.ADMIN ? '/admin' : '/creator',
    activeLocale,
  );
  const isReviewScope =
    user?.role === UserRole.ADMIN && effectiveScope === 'review';
  const {
    actionError,
    actionMessage,
    actingCourseId,
    error,
    formatAuditDateTime,
    formatLevel,
    formatStatus,
    formatUpdatedAt,
    handleDeleteCourse,
    handleStatusChange,
    loading,
    localizedCourses,
    summary,
    t,
  } = useAdminCourses(effectiveScope);

  const scopeTabs = useMemo(
    () => [
      {
        key: 'mine' as const,
        label: t('courseScopes.mine'),
        active: effectiveScope === 'mine',
      },
      {
        key: 'review' as const,
        label: t('courseScopes.review'),
        active: effectiveScope === 'review',
      },
    ],
    [effectiveScope, t],
  );

  const setScope = (scope: CourseManagementScope) => {
    const params = new URLSearchParams(searchParams.toString());

    if (scope === 'review') {
      params.set('scope', 'review');
    } else {
      params.delete('scope');
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href={backHref} className={styles.backLink}>
            {t('backToOverview')}
          </Link>
          <p className={styles.eyebrow}>{t('coursesEyebrow')}</p>
          <h1 className={styles.title}>
            {t(isReviewScope ? 'reviewCoursesTitle' : 'myCoursesTitle')}
          </h1>
          <p className={styles.subtitle}>
            {t(isReviewScope ? 'reviewCoursesSubtitle' : 'myCoursesSubtitle')}
          </p>
        </div>

        <div className={styles.heroActions}>
          {user?.role === UserRole.ADMIN ? (
            <div className={styles.scopeTabs} aria-label={t('courseScopes.label')}>
              {scopeTabs.map((scopeTab) => (
                <button
                  key={scopeTab.key}
                  type="button"
                  className={`${styles.scopeTab} ${
                    scopeTab.active ? styles.scopeTabActive : ''
                  }`}
                  onClick={() => setScope(scopeTab.key)}
                  aria-pressed={scopeTab.active}
                >
                  {scopeTab.label}
                </button>
              ))}
            </div>
          ) : null}
          <Link
            href={localizePathname('/admin/courses/new', activeLocale)}
            className={styles.primaryAction}
          >
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
        emptyDescription={t(
          isReviewScope
            ? 'emptyReviewCoursesDescription'
            : 'emptyMyCoursesDescription',
        )}
        emptyTitle={t(
          isReviewScope ? 'emptyReviewCoursesTitle' : 'emptyMyCoursesTitle',
        )}
        error={error}
        formatAuditDateTime={formatAuditDateTime}
        formatLevel={formatLevel}
        formatStatus={formatStatus}
        formatUpdatedAt={formatUpdatedAt}
        loading={loading}
        onDelete={(course) => void handleDeleteCourse(course)}
        onStatusChange={(course, nextStatus) => void handleStatusChange(course, nextStatus)}
        showLearningSummary={!isReviewScope}
        sectionDescription={t(
          isReviewScope
            ? 'reviewCoursesListDescription'
            : 'myCoursesListDescription',
        )}
        sectionTitle={t(
          isReviewScope ? 'reviewCoursesListTitle' : 'myCoursesListTitle',
        )}
        showOwner={isReviewScope}
        t={t}
        activeLocale={activeLocale}
      />
    </div>
  );
}
