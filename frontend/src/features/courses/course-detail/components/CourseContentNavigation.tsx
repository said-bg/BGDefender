import Link from 'next/link';
import { useState } from 'react';
import type { TFunction } from 'i18next';
import { NavigationItem, ViewState } from '../courseDetail.utils';
import styles from './CourseContentNavigation.module.css';

interface CourseContentNavigationProps {
  currentKind: 'overview' | 'chapter' | 'subchapter' | 'quiz' | 'final-test';
  hasFinalTest: boolean;
  nextItem: NavigationItem | null;
  onNavigateToView: (view: ViewState) => void;
  previousItem: NavigationItem | null;
  t: TFunction<'courses', undefined>;
}

export default function CourseContentNavigation({
  currentKind,
  hasFinalTest,
  nextItem,
  onNavigateToView,
  previousItem,
  t,
}: CourseContentNavigationProps) {
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);

  const handleNavigate = (item: NavigationItem | null) => {
    if (!item) {
      return;
    }

    onNavigateToView(item.view);

    const contentPanel = document.querySelector<HTMLElement>('[data-course-content-panel]');
    if (contentPanel) {
      contentPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const isCourseEnd = !nextItem && currentKind !== 'overview';
  const completionTitle =
    currentKind === 'final-test'
      ? t('detail.courseCompletedTitle', {
          defaultValue: 'Congratulations, you finished this course',
        })
      : t('detail.chapterCompletedTitle', {
          defaultValue: 'Nice work, you reached the end of this course path',
        });
  const completionDescription =
    currentKind === 'final-test'
      ? t('detail.courseCompletedDescription', {
          defaultValue:
            'You completed the final step of this course. Your result is saved, and you can review the material again whenever you want.',
        })
      : hasFinalTest
        ? t('detail.finalTestUnlockedNextDescription', {
            defaultValue:
              'You completed the last chapter. The final test is now the next step in your learning path.',
          })
        : t('detail.coursePathCompletedDescription', {
            defaultValue:
              'You reached the end of this course content. You can review the material again from the overview whenever you want.',
          });

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
        {isCourseEnd ? (
          <button
            type="button"
            className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
            onClick={() => setIsCompletionOpen(true)}
          >
            {t('detail.finishCourse', { defaultValue: 'Finish' })}
          </button>
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
              {t('detail.courseJourneyComplete', { defaultValue: 'Course complete' })}
            </p>
            <h3 className={styles.completionTitle}>{completionTitle}</h3>
            <p className={styles.completionDescription}>{completionDescription}</p>
            <div className={styles.completionActions}>
              <button
                type="button"
                className={styles.navigationButton}
                onClick={() => setIsCompletionOpen(false)}
              >
                {t('detail.close', { defaultValue: 'Close' })}
              </button>
              <Link
                href="/"
                className={`${styles.navigationButton} ${styles.navigationButtonPrimary}`}
                onClick={() => setIsCompletionOpen(false)}
              >
                {t('detail.backToHome', { defaultValue: 'Back to home' })}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
