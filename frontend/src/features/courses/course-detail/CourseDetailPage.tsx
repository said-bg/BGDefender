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

      <div
        className={`${styles.readerToolbar} ${!isSidebarVisible ? styles.readerToolbarFocus : ''}`}
      >
        <button
          type="button"
          className={styles.sidebarToggle}
          aria-expanded={isSidebarVisible ? 'true' : 'false'}
          aria-controls="course-outline-panel"
          aria-label={
            isSidebarVisible ? detail.t('detail.hideOutline') : detail.t('detail.showOutline')
          }
          title={isSidebarVisible ? detail.t('detail.hideOutline') : detail.t('detail.showOutline')}
          onClick={() => setIsSidebarVisible((previous) => !previous)}
        >
          <span className={styles.sidebarToggleIcon} aria-hidden="true">
            {isSidebarVisible ? '-' : '+'}
          </span>
          <span className={styles.visuallyHidden}>
            {isSidebarVisible ? detail.t('detail.hideOutline') : detail.t('detail.showOutline')}
          </span>
        </button>
      </div>

      <div className={`${styles.layout} ${!isSidebarVisible ? styles.layoutFocus : ''}`}>
        <CourseSidebar
          id="course-outline-panel"
          hidden={!isSidebarVisible}
          course={detail.course}
          activeLanguage={detail.activeLanguage}
          selectedView={detail.selectedView}
          expandedChapters={detail.expandedChapters}
          courseProgressLabel={detail.t('detail.courseProgress')}
          overviewLabel={detail.t('detail.overview')}
          heroSummary={detail.heroSummary}
          onSelectOverview={() => detail.navigateToView({ type: 'overview' })}
          onToggleChapter={detail.toggleChapter}
          onOpenSubChapter={detail.openSubChapter}
        />

        <div className={`${styles.contentSlot} ${!isSidebarVisible ? styles.contentSlotFocus : ''}`}>
          <CourseContent
            course={detail.course}
            activeLanguage={detail.activeLanguage}
            selectedContent={detail.selectedContent}
            accessState={detail.accessState}
            canReadContent={detail.canReadContent}
            courseAuthorFallback={detail.courseAuthorFallback}
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
