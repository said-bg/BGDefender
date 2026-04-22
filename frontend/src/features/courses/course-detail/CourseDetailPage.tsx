'use client';

import { useState } from 'react';
import styles from './CourseDetailPage.module.css';
import { CourseContent } from './components/CourseContent';
import CourseDetailHero from './components/CourseDetailHero';
import CourseDetailStatus from './components/CourseDetailStatus';
import { CourseSidebar } from './components/CourseSidebar';
import { useCourseDetailPage } from './useCourseDetailPage';

export default function CourseDetailPage() {
  const detail = useCourseDetailPage();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  if (detail.loading) {
    return <CourseDetailStatus message={detail.t('detail.loadingCourse')} />;
  }

  if (detail.errorKey || !detail.course || !detail.selectedContent) {
    return (
      <CourseDetailStatus
        message={
          detail.errorKey === 'unableToLoad'
            ? detail.t('detail.unableToLoad')
            : detail.t('detail.courseNotFound')
        }
      />
    );
  }

  return (
    <div className={styles.pageShell}>
      <CourseDetailHero
        course={detail.course}
        courseTitle={detail.courseTitle}
        durationLabel={detail.durationLabel}
        favoriteAddLabel={detail.t('favorites.add')}
        favoriteRemoveLabel={detail.t('favorites.remove')}
        favoriteVisibleLabel={detail.t('favorites.title')}
        freeCourseLabel={detail.t('detail.freeCourse')}
        heroSummary={detail.heroSummary}
        isAuthenticated={detail.isAuthenticated}
        isFavorite={detail.isFavorite}
        isPending={detail.isPending}
        onToggleFavorite={(courseId) => void detail.toggleFavorite(courseId)}
        premiumCourseLabel={detail.t('detail.premiumCourse')}
      />

      <div className={`${styles.layout} ${!isSidebarVisible ? styles.layoutFocus : ''}`}>
        {isSidebarVisible ? (
          <div className={styles.sidebarSlot}>
            <button
              type="button"
              className={`${styles.sidebarToggle} ${styles.sidebarToggleInline}`}
              aria-expanded="true"
              aria-controls="course-outline-panel"
              aria-label={detail.t('detail.hideOutline')}
              title={detail.t('detail.hideOutline')}
              onClick={() => setIsSidebarVisible(false)}
            >
              <span className={styles.sidebarToggleIcon} aria-hidden="true">
                -
              </span>
              <span className={styles.visuallyHidden}>{detail.t('detail.hideOutline')}</span>
            </button>

            <CourseSidebar
              id="course-outline-panel"
              hidden={false}
              course={detail.course}
              activeLanguage={detail.activeLanguage}
              selectedView={detail.selectedView}
              expandedChapters={detail.expandedChapters}
              courseProgressLabel={detail.t('detail.courseProgress')}
              overviewLabel={detail.t('detail.overview')}
              heroSummary={detail.heroSummary}
              quizLabel={detail.t('detail.trainingQuiz', { defaultValue: 'Training quiz' })}
              quizDescription={detail.t('detail.trainingQuizSidebar', {
                defaultValue: 'Score-based practice for this chapter',
              })}
              finalTestLabel={detail.t('detail.finalTest', { defaultValue: 'Final test' })}
              finalTestDescription={detail.t('detail.finalTestSidebar', {
                defaultValue: 'Course-wide assessment unlocked after all chapters',
              })}
              onSelectOverview={() => detail.navigateToView({ type: 'overview' })}
              onOpenFinalTest={detail.openFinalTest}
              onToggleChapter={detail.toggleChapter}
              onOpenQuiz={detail.openQuiz}
              onOpenSubChapter={detail.openSubChapter}
            />
          </div>
        ) : null}

        <div className={`${styles.contentSlot} ${!isSidebarVisible ? styles.contentSlotFocus : ''}`}>
          <CourseContent
            courseId={detail.course.id}
            course={detail.course}
            activeLanguage={detail.activeLanguage}
            selectedContent={detail.selectedContent}
            accessState={detail.accessState}
            canAccessAssessments={detail.canAccessAssessments}
            canReadContent={detail.canReadContent}
            courseAuthorFallback={detail.courseAuthorFallback}
            isAuthenticated={detail.isAuthenticated}
            headerAction={
              !isSidebarVisible ? (
                <button
                  type="button"
                  className={styles.sidebarToggle}
                  aria-expanded="false"
                  aria-controls="course-outline-panel"
                  aria-label={detail.t('detail.showOutline')}
                  title={detail.t('detail.showOutline')}
                  onClick={() => setIsSidebarVisible(true)}
                >
                  <span className={styles.sidebarToggleIcon} aria-hidden="true">
                    +
                  </span>
                  <span className={styles.visuallyHidden}>{detail.t('detail.showOutline')}</span>
                </button>
              ) : null
            }
            isFocusMode={!isSidebarVisible}
            previousItem={detail.previousItem}
            nextItem={detail.nextItem}
            onNavigateToView={detail.navigateToView}
          />
        </div>
      </div>
    </div>
  );
}
