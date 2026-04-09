'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/api';
import formStyles from './EditCourseForm.module.css';
import sharedStyles from './EditCoursePage.module.css';
import shellStyles from './EditCourseShell.module.css';

export type EditCourseSection =
  | 'details'
  | 'structure'
  | 'content'
  | 'quiz'
  | 'final-test';

export const getEditCourseHref = (
  courseId: string,
  section: EditCourseSection,
) => {
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
  courseTitle?: string;
  wide?: boolean;
  children: ReactNode;
};

export function EditCourseProtected({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}

export function EditCourseShell({
  courseId,
  section,
  title,
  subtitle,
  courseTitle,
  wide = false,
  children,
}: EditCourseShellProps) {
  const { t } = useTranslation('admin');

  const tabs: Array<{ key: EditCourseSection; label: string }> = [
    {
      key: 'details',
      label: t('edit.tabs.details', { defaultValue: 'Course details' }),
    },
    {
      key: 'structure',
      label: t('edit.tabs.structure', { defaultValue: 'Structure' }),
    },
    {
      key: 'content',
      label: t('edit.tabs.content', { defaultValue: 'Content' }),
    },
    {
      key: 'quiz',
      label: t('edit.tabs.quiz', { defaultValue: 'Training quiz' }),
    },
    {
      key: 'final-test',
      label: t('edit.tabs.finalTest', { defaultValue: 'Final test' }),
    },
  ];

  return (
    <div className={`${shellStyles.page} ${wide ? shellStyles.pageWide : ''}`}>
      <section className={shellStyles.hero}>
        <div className={shellStyles.heroCopy}>
          <Link href="/admin/courses" className={shellStyles.backLink}>
            {t('edit.backToCourses', {
              defaultValue: 'Back to course library',
            })}
          </Link>
          <p className={shellStyles.eyebrow}>
            {t('edit.eyebrow', { defaultValue: 'Edit course' })}
          </p>
          <h1 className={shellStyles.title}>{title}</h1>
          {subtitle ? <p className={shellStyles.subtitle}>{subtitle}</p> : null}
          {courseTitle ? <p className={sharedStyles.helperText}>{courseTitle}</p> : null}

          <nav className={shellStyles.sectionNav} aria-label="Edit course sections">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={getEditCourseHref(courseId, tab.key)}
                className={`${shellStyles.sectionNavLink} ${
                  section === tab.key ? shellStyles.sectionNavLinkActive : ''
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
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
        <p className={sharedStyles.helperMessage}>
          {t('loading', { defaultValue: 'Loading admin data...' })}
        </p>
      </section>
    </div>
  );
}

export function EditCourseErrorState({ message }: { message: string }) {
  const { t } = useTranslation('admin');

  return (
    <div className={shellStyles.page}>
      <section className={formStyles.formCard}>
        <p className={sharedStyles.errorMessage}>{message}</p>
        <div className={sharedStyles.actions}>
          <Link href="/admin/courses" className={sharedStyles.secondaryAction}>
            {t('backToOverview', { defaultValue: 'Back to dashboard' })}
          </Link>
        </div>
      </section>
    </div>
  );
}







