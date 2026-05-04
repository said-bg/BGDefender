'use client';

import { useEffect, useState } from 'react';
import styles from './CourseDetailPage.module.css';
import { CourseContent } from './components/CourseContent';
import CourseDetailHero from './components/CourseDetailHero';
import CourseDetailStatus from './components/CourseDetailStatus';
import { CourseSidebar } from './components/CourseSidebar';
import { useCourseDetailPage } from './useCourseDetailPage';
import { scrollToCourseContentHeader, scrollToCourseHero } from './courseDetail.utils';

export default function CourseDetailPage() {
  const detail = useCourseDetailPage();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const loadedCourseId = detail.course?.id;
  const activeViewKey =
    detail.selectedView.type === 'overview'
      ? 'overview'
      : detail.selectedView.type === 'final-test'
        ? 'final-test'
        : detail.selectedView.type === 'chapter'
          ? `chapter:${detail.selectedView.chapterId}`
          : detail.selectedView.type === 'quiz'
            ? `quiz:${detail.selectedView.chapterId}`
            : `subchapter:${detail.selectedView.subChapterId}`;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 980px)');

    const syncViewport = (matches: boolean) => {
      setIsMobileViewport(matches);
      setIsSidebarVisible(matches ? detail.shouldFocusCourseContent : true);
    };

    syncViewport(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncViewport(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [detail.shouldFocusCourseContent]);

  useEffect(() => {
    if (!isMobileViewport || !isSidebarVisible) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileViewport, isSidebarVisible]);

  useEffect(() => {
    if (detail.loading || !loadedCourseId) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (detail.viewportMode === 'entry') {
        scrollToCourseHero('auto');
        return;
      }

      scrollToCourseContentHeader('smooth');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeViewKey, detail.loading, detail.viewportMode, loadedCourseId]);

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
        isAuthenticated={detail.isAuthenticated && !detail.isAdminPreview}
        isFavorite={detail.isFavorite}
        isPending={detail.isPending}
        onToggleFavorite={(courseId) => void detail.toggleFavorite(courseId)}
        premiumCourseLabel={detail.t('detail.premiumCourse')}
      />

      <div className={`${styles.layout} ${!isSidebarVisible ? styles.layoutFocus : ''}`}>
        {isSidebarVisible && isMobileViewport ? (
          <>
            <button
              type="button"
              className={styles.sidebarBackdrop}
              aria-label={detail.t('detail.hideOutline')}
              onClick={() => setIsSidebarVisible(false)}
            />

            <div className={styles.sidebarMobileSheet}>
              <div className={styles.sidebarMobileHeader}>
                <span className={styles.sidebarMobileEyebrow}>
                  {detail.t('detail.courseDetail')}
                </span>
                <button
                  type="button"
                  className={styles.sidebarToggle}
                  aria-label={detail.t('detail.hideOutline')}
                  title={detail.t('detail.hideOutline')}
                  onClick={() => setIsSidebarVisible(false)}
                >
                  <span className={styles.sidebarToggleIcon} aria-hidden="true">
                    -
                  </span>
                  <span className={styles.visuallyHidden}>{detail.t('detail.hideOutline')}</span>
                </button>
              </div>

              <CourseSidebar
                id="course-outline-panel"
                hidden={false}
                course={detail.course}
                activeLanguage={detail.activeLanguage}
                selectedView={detail.selectedView}
                expandedChapters={detail.expandedChapters}
                courseProgressLabel={detail.t('detail.courseProgress')}
                overviewLabel={detail.t('detail.overview')}
                quizLabel={detail.t('detail.trainingQuiz')}
                quizDescription={detail.t('detail.trainingQuizSidebar')}
                finalTestLabel={detail.t('detail.finalTest')}
                showProgress={!detail.isStructurePreview}
                finalTestDescription={detail.t('detail.finalTestSidebar')}
                showUnpublishedAssessments={detail.isAdminPreview}
                onSelectOverview={() => {
                  detail.navigateToView({ type: 'overview' });
                  setIsSidebarVisible(false);
                }}
                onOpenFinalTest={() => {
                  detail.openFinalTest();
                  setIsSidebarVisible(false);
                }}
                onToggleChapter={detail.toggleChapter}
                onOpenQuiz={(chapterId) => {
                  detail.openQuiz(chapterId);
                  setIsSidebarVisible(false);
                }}
                onOpenSubChapter={(chapterId, subChapterId) => {
                  detail.openSubChapter(chapterId, subChapterId);
                  setIsSidebarVisible(false);
                }}
              />
            </div>
          </>
        ) : isSidebarVisible ? (
          <div className={styles.sidebarSlot}>
            <button
              type="button"
              className={`${styles.sidebarToggle} ${styles.sidebarToggleInline}`}
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
              quizLabel={detail.t('detail.trainingQuiz')}
              quizDescription={detail.t('detail.trainingQuizSidebar')}
              finalTestLabel={detail.t('detail.finalTest')}
              showProgress={!detail.isStructurePreview}
              finalTestDescription={detail.t('detail.finalTestSidebar')}
              showUnpublishedAssessments={detail.isAdminPreview}
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
            isPreviewMode={detail.isAdminPreview}
            isCourseCompleted={detail.isCourseCompleted}
            showUnpublishedAssessments={detail.isAdminPreview}
            headerAction={
              !isSidebarVisible ? (
                <button
                  type="button"
                  className={styles.sidebarToggle}
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
