'use client';

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Course } from '@/services/course';
import styles from './CourseContent.module.css';
import {
  ActiveLanguage,
  NavigationItem,
  SelectedContent,
  ViewState,
  getVisibleFinalTest,
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
  isCourseCompleted?: boolean;
  isFocusMode?: boolean;
  isPreviewMode?: boolean;
  showUnpublishedAssessments?: boolean;
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
  isCourseCompleted = false,
  isFocusMode = false,
  isPreviewMode = false,
  showUnpublishedAssessments = false,
  previousItem,
  nextItem,
  onNavigateToView,
}: CourseContentProps) {
  const { t } = useTranslation('courses');
  const accessDescription =
    accessState === 'checking'
      ? t('detail.checkingAccess')
      : accessState === 'login_required'
      ? t('detail.loginRequiredDescription')
      : t('detail.premiumRequiredDescription');
  const visibleFinalTest = getVisibleFinalTest(course, {
    includeUnpublishedAssessments: showUnpublishedAssessments,
  });

  return (
    <main
      className={`${styles.contentPanel} ${isFocusMode ? styles.contentPanelFocus : ''}`}
      data-course-content-panel
    >
      <div className={styles.contentHeader} data-course-content-header>
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
              previewMode={isPreviewMode}
            />
          ) : selectedContent.kind === 'final-test' ? (
            <CourseFinalTest
              activeLanguage={activeLanguage}
              courseId={courseId}
              enabled={canAccessAssessments && Boolean(visibleFinalTest)}
              previewMode={isPreviewMode}
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
        isCourseCompleted={isCourseCompleted}
        currentKind={selectedContent.kind}
        hasFinalTest={Boolean(visibleFinalTest)}
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
