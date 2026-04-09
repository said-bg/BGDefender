'use client';

import { useTranslation } from 'react-i18next';
import { Course } from '@/services/courseService';
import styles from './CourseContent.module.css';
import {
  ActiveLanguage,
  NavigationItem,
  SelectedContent,
  ViewState,
} from '../courseDetail.utils';
import CourseAuthorsSection from './CourseAuthorsSection';
import CourseContentBlocks from './CourseContentBlocks';
import CourseContentNavigation from './CourseContentNavigation';
import CourseLockedPanel from './CourseLockedPanel';

type AccessState = 'public' | 'checking' | 'login_required' | 'premium_required' | 'granted';

type CourseContentProps = {
  accessState: AccessState;
  activeLanguage: ActiveLanguage;
  canReadContent: boolean;
  course: Course;
  courseAuthorFallback: string;
  isFocusMode?: boolean;
  nextItem: NavigationItem | null;
  onNavigateToView: (view: ViewState) => void;
  previousItem: NavigationItem | null;
  selectedContent: SelectedContent;
};

export function CourseContent({
  course,
  activeLanguage,
  selectedContent,
  accessState,
  canReadContent,
  courseAuthorFallback,
  isFocusMode = false,
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

  return (
    <main className={`${styles.contentPanel} ${isFocusMode ? styles.contentPanelFocus : ''}`}>
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
          <CourseContentBlocks activeLanguage={activeLanguage} selectedContent={selectedContent} />
        </div>
      ) : (
        <CourseLockedPanel accessState={accessState} t={t} />
      )}

      <CourseContentNavigation
        nextItem={nextItem}
        onNavigateToView={onNavigateToView}
        previousItem={previousItem}
        t={t}
      />
    </main>
  );
}

export default CourseContent;
