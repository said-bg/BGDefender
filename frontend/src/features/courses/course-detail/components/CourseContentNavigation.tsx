import Link from 'next/link';
import { useState } from 'react';
import type { TFunction } from 'i18next';
import { NavigationItem, ViewState } from '../courseDetail.utils';
import styles from './CourseContentNavigation.module.css';

interface CourseContentNavigationProps {
  accessState: 'public' | 'checking' | 'login_required' | 'premium_required' | 'granted';
  currentKind: 'overview' | 'chapter' | 'subchapter' | 'quiz' | 'final-test';
  hasFinalTest: boolean;
  isAuthenticated: boolean;
  isCourseCompleted: boolean;
  nextItem: NavigationItem | null;
  onNavigateToView: (view: ViewState) => void;
  previousItem: NavigationItem | null;
  t: TFunction<'courses', undefined>;
}

export default function CourseContentNavigation({
  accessState,
  currentKind,
  hasFinalTest,
  isAuthenticated,
  isCourseCompleted,
  nextItem,
  onNavigateToView,
  previousItem,
  t,
}: CourseContentNavigationProps) {
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const loginHref =
    typeof window === 'undefined'
      ? '/login'
      : `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}`,
        )}`;

  const handleNavigate = (item: NavigationItem | null) => {
    if (!item) {
      return;
    }

    onNavigateToView(item.view);
  };

  const isCourseEnd = !nextItem && currentKind !== 'overview';
  const shouldPromptLogin =
    accessState === 'login_required' || (currentKind === 'overview' && !isAuthenticated);
  const isNavigationBlocked =
    accessState === 'checking' || accessState === 'premium_required';
  const completionTitle =
    currentKind === 'final-test'
      ? t('detail.courseCompletedTitle')
      : t('detail.chapterCompletedTitle');
  const completionDescription =
    currentKind === 'final-test'
      ? t('detail.courseCompletedDescription')
      : hasFinalTest
        ? t('detail.finalTestUnlockedNextDescription')
        : t('detail.coursePathCompletedDescription');

  return (
    <>
      <div className={styles.navigationFooter}>
        <button
          type="button"
          className={styles.navigationButton}
          onClick={() => handleNavigate(previousItem)}
          disabled={!previousItem}
        >
          {t('detail.previous')}
        </button>
        {shouldPromptLogin ? (
          <Link
            href={loginHref}
            className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
          >
            {t('detail.next')}
          </Link>
        ) : isNavigationBlocked ? (
          <button
            type="button"
            className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
            disabled
          >
            {accessState === 'checking'
              ? t('detail.checkingAccess')
              : t('detail.premiumRequiredTitle')}
          </button>
        ) : isCourseEnd ? (
          isCourseCompleted ? (
            <button
              type="button"
              className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
              onClick={() => onNavigateToView({ type: 'overview' })}
            >
              {t('detail.backToOverview')}
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
              onClick={() => setIsCompletionOpen(true)}
            >
              {t('detail.finishCourse')}
            </button>
          )
        ) : (
          <button
            type="button"
            className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
            onClick={() => handleNavigate(nextItem)}
            disabled={!nextItem}
          >
            {t('detail.next')}
          </button>
        )}
      </div>

      {isCompletionOpen ? (
        <div
          className={styles.completionOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={completionTitle}
        >
          <div className={styles.completionCard}>
            <p className={styles.completionEyebrow}>
              {t('detail.courseJourneyComplete')}
            </p>
            <h3 className={styles.completionTitle}>{completionTitle}</h3>
            <p className={styles.completionDescription}>{completionDescription}</p>
            <div className={styles.completionActions}>
              <button
                type="button"
                className={styles.navigationButton}
                onClick={() => setIsCompletionOpen(false)}
              >
                {t('detail.close')}
              </button>
              <Link
                href="/"
                className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
                onClick={() => setIsCompletionOpen(false)}
              >
                {t('detail.backToHome')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
