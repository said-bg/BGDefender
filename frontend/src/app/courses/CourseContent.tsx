'use client';

import Link from 'next/link';
import { Trans, useTranslation } from 'react-i18next';
import { Course } from '@/services/courseService';
import styles from './course-page.module.css';
import {
  ActiveLanguage,
  NavigationItem,
  SelectedContent,
  ViewState,
  getAuthorRole,
} from './course-detail.utils';

type AccessState =
  | 'public'
  | 'checking'
  | 'login_required'
  | 'premium_required'
  | 'granted';

type CourseContentProps = {
  course: Course;
  activeLanguage: ActiveLanguage;
  selectedContent: SelectedContent;
  accessState: AccessState;
  canReadContent: boolean;
  courseAuthorFallback: string;
  previousItem: NavigationItem | null;
  nextItem: NavigationItem | null;
  onNavigateToView: (view: ViewState) => void;
};

export function CourseContent({
  course,
  activeLanguage,
  selectedContent,
  accessState,
  canReadContent,
  courseAuthorFallback,
  previousItem,
  nextItem,
  onNavigateToView,
}: CourseContentProps) {
  const { t } = useTranslation('courses');

  return (
    <main className={styles.contentPanel}>
      <div className={styles.contentHeader}>
        <div>
          <p className={styles.contentEyebrow}>
            {selectedContent.kind === 'overview'
              ? t('detail.courseDetail')
              : selectedContent.kind === 'chapter'
                ? t('detail.chapterOverview')
                : selectedContent.parentTitle}
          </p>
          <h2 className={styles.contentTitle}>{selectedContent.title}</h2>
        </div>
      </div>

      <p className={styles.contentDescription}>
        {canReadContent
          ? selectedContent.description
          : accessState === 'checking'
            ? t('detail.checkingAccess')
            : accessState === 'login_required'
              ? t('detail.loginRequiredDescription')
              : t('detail.premiumRequiredDescription')}
      </p>

      {selectedContent.kind === 'overview' && (
        <section className={styles.authorsSection}>
          <h3 className={styles.sectionTitle}>{t('detail.writtenBy')}</h3>
          <div className={styles.authorGrid}>
            {course.authors.map((author) => (
              <article key={author.id} className={styles.authorCard}>
                {author.photo ? (
                  <img
                    src={author.photo}
                    alt={author.name}
                    className={styles.authorAvatarImage}
                  />
                ) : (
                  <div className={styles.authorAvatar}>
                    {author.name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <div className={styles.authorName}>{author.name}</div>
                  <div className={styles.authorRole}>
                    {getAuthorRole(activeLanguage, author, courseAuthorFallback)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {canReadContent ? (
        <div className={styles.contentBody}>
          {selectedContent.paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph}`} className={styles.contentParagraph}>
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <div className={styles.lockedPanel}>
          {accessState === 'login_required' ? (
            <p className={styles.lockedText}>
              <Trans
                t={t}
                i18nKey="detail.loginRequiredPromptInline"
                components={{
                  loginLink: (
                    <Link
                      href="/auth/login"
                      className={styles.lockedInlineLink}
                    />
                  ),
                }}
              />
            </p>
          ) : (
            <p className={styles.lockedText}>
              {accessState === 'checking'
                ? t('detail.checkingAccessText')
                : t('detail.premiumRequiredPrompt')}
            </p>
          )}
        </div>
      )}

      <div className={styles.navigationFooter}>
        <button
          type="button"
          className={styles.navigationButton}
          onClick={() => previousItem && onNavigateToView(previousItem.view)}
          disabled={!previousItem}
        >
          {t('detail.previous')}
        </button>
        <button
          type="button"
          className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
          onClick={() => nextItem && onNavigateToView(nextItem.view)}
          disabled={!nextItem}
        >
          {t('detail.next')}
        </button>
      </div>
    </main>
  );
}

export default CourseContent;
