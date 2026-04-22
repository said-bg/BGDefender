'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Course } from '@/services/course';
import styles from './CourseContent.module.css';
import {
  ActiveLanguage,
  NavigationItem,
  SelectedContent,
  ViewState,
} from '../courseDetail.utils';
import CourseAuthorsSection from './CourseAuthorsSection';
import CourseFinalTest from './CourseFinalTest';
import ChapterTrainingQuiz from './ChapterTrainingQuiz';
import CourseContentBlocks from './CourseContentBlocks';
import CourseContentNavigation from './CourseContentNavigation';
import CourseLockedPanel from './CourseLockedPanel';

type AccessState = 'public' | 'checking' | 'login_required' | 'premium_required' | 'granted';

type CourseContentProps = {
  accessState: AccessState;
  activeLanguage: ActiveLanguage;
  canReadContent: boolean;
  canAccessAssessments: boolean;
  courseId: string;
  course: Course;
  courseAuthorFallback: string;
  headerAction?: ReactNode;
  isAuthenticated: boolean;
  isFocusMode?: boolean;
  nextItem: NavigationItem | null;
  onNavigateToView: (view: ViewState) => void;
  previousItem: NavigationItem | null;
  selectedContent: SelectedContent;
};

export function CourseContent({
  courseId,
  course,
  activeLanguage,
  selectedContent,
  accessState,
  canReadContent,
  canAccessAssessments,
  courseAuthorFallback,
  headerAction,
  isAuthenticated,
  isFocusMode = false,
  previousItem,
  nextItem,
  onNavigateToView,
}: CourseContentProps) {
  const { t } = useTranslation('courses');
  const hasScrolledOnMountRef = useRef(false);
  const accessDescription =
    accessState === 'checking'
      ? t('detail.checkingAccess')
      : accessState === 'login_required'
      ? t('detail.loginRequiredDescription')
      : t('detail.premiumRequiredDescription');
  const publishedFinalTest = course.finalTests?.find((finalTest) => finalTest.isPublished) ?? null;

  useEffect(() => {
    if (!hasScrolledOnMountRef.current) {
      hasScrolledOnMountRef.current = true;
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const contentPanel = document.querySelector<HTMLElement>('[data-course-content-panel]');

      if (contentPanel) {
        contentPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedContent.kind, selectedContent.title]);

  return (
    <main
      className={`${styles.contentPanel} ${isFocusMode ? styles.contentPanelFocus : ''}`}
      data-course-content-panel
    >
      <div className={styles.contentHeader}>
        {headerAction ? <div className={styles.contentHeaderAction}>{headerAction}</div> : null}
        <div>
          <p className={styles.contentEyebrow}>
            {selectedContent.kind === 'overview'
              ? t('detail.courseDetail')
              : selectedContent.kind === 'chapter'
                ? t('detail.chapterOverview')
                : selectedContent.kind === 'quiz'
                  ? t('detail.trainingQuiz', { defaultValue: 'Training quiz' })
                  : selectedContent.kind === 'final-test'
                    ? t('detail.finalTestEyebrow', { defaultValue: 'Final assessment' })
                : selectedContent.parentTitle}
          </p>
          <h2 className={styles.contentTitle}>{selectedContent.title}</h2>
        </div>
      </div>

      {(selectedContent.description || (!canReadContent && accessState !== 'granted')) && (
        <p className={styles.contentDescription}>
          {canReadContent ? selectedContent.description : accessDescription}
        </p>
      )}

      {selectedContent.kind === 'overview' ? (
        <CourseAuthorsSection
          activeLanguage={activeLanguage}
          course={course}
          courseAuthorFallback={courseAuthorFallback}
          title={t('detail.writtenBy')}
        />
      ) : null}

      {canReadContent ? (
        <div className={styles.contentBody}>
          {selectedContent.kind === 'quiz' && selectedContent.chapterId ? (
            <ChapterTrainingQuiz
              activeLanguage={activeLanguage}
              chapterId={selectedContent.chapterId}
              courseId={courseId}
              passingScore={selectedContent.passingScore ?? 70}
            />
          ) : selectedContent.kind === 'final-test' ? (
            <CourseFinalTest
              activeLanguage={activeLanguage}
              courseId={courseId}
              enabled={canAccessAssessments && Boolean(publishedFinalTest)}
            />
          ) : (
            <CourseContentBlocks activeLanguage={activeLanguage} selectedContent={selectedContent} />
          )}
        </div>
      ) : (
        <CourseLockedPanel accessState={accessState} t={t} />
      )}

      <CourseContentNavigation
        accessState={accessState}
        currentKind={selectedContent.kind}
        hasFinalTest={Boolean(publishedFinalTest)}
        isAuthenticated={isAuthenticated}
        nextItem={nextItem}
        onNavigateToView={onNavigateToView}
        previousItem={previousItem}
        t={t}
      />
    </main>
  );
}

export default CourseContent;
