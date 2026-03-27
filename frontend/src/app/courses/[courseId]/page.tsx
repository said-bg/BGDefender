'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import styles from '../course-page.module.css';
import courseService, { Course } from '@/services/courseService';
import { useAuth } from '@/hooks';
import { UserPlan, UserRole } from '@/types/api';
import { CourseContent } from '../CourseContent';
import { CourseSidebar } from '../CourseSidebar';
import {
  ActiveLanguage,
  NavigationItem,
  SelectedContent,
  ViewState,
  buildNavigationItems,
  getLocalizedText,
  getOverviewParagraphs,
  getSelectedContent,
} from '../course-detail.utils';

type ErrorKey = 'courseNotFound' | 'unableToLoad' | null;
type AccessState =
  | 'public'
  | 'checking'
  | 'login_required'
  | 'premium_required'
  | 'granted';

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const { i18n, t } = useTranslation('courses');
  const { user, isAuthenticated, isInitialized } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<ErrorKey>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(),
  );
  const [selectedView, setSelectedView] = useState<ViewState>({
    type: 'overview',
  });

  const courseId = Array.isArray(params?.courseId)
    ? params.courseId[0]
    : params?.courseId;
  const activeLanguage: ActiveLanguage = i18n.language === 'fi' ? 'fi' : 'en';
  const courseAuthorFallback = t('detail.courseAuthor');

  useEffect(() => {
    if (!courseId) {
      setErrorKey('courseNotFound');
      setLoading(false);
      return;
    }

    const loadCourse = async () => {
      try {
        setLoading(true);
        setErrorKey(null);

        const result = await courseService.getCourseById(courseId);

        setCourse(result);
        setSelectedView({ type: 'overview' });
        setExpandedChapters(new Set());
      } catch (loadError) {
        console.error('Failed to load course detail:', loadError);
        setErrorKey('unableToLoad');
      } finally {
        setLoading(false);
      }
    };

    void loadCourse();
  }, [courseId]);

  const selectedContent = useMemo<SelectedContent | null>(() => {
    if (!course) {
      return null;
    }

    return getSelectedContent(course, selectedView, activeLanguage, t);
  }, [course, selectedView, activeLanguage, t]);

  const accessState = useMemo<AccessState>(() => {
    if (selectedView.type === 'overview') {
      return 'public';
    }

    if (!isInitialized) {
      return 'checking';
    }

    if (!isAuthenticated || !user) {
      return 'login_required';
    }

    if (
      course?.level === 'premium' &&
      user.plan !== UserPlan.PREMIUM &&
      user.role !== UserRole.ADMIN
    ) {
      return 'premium_required';
    }

    return 'granted';
  }, [course?.level, isAuthenticated, isInitialized, selectedView.type, user]);

  const navigationItems = useMemo<NavigationItem[]>(() => {
    if (!course) {
      return [];
    }

    return buildNavigationItems(course);
  }, [course]);

  const currentViewKey =
    selectedView.type === 'overview'
      ? 'overview'
      : selectedView.type === 'chapter'
        ? `chapter:${selectedView.chapterId}`
        : `subchapter:${selectedView.subChapterId}`;

  const currentNavigationIndex = navigationItems.findIndex(
    (item) => item.key === currentViewKey,
  );

  const previousItem =
    currentNavigationIndex > 0
      ? navigationItems[currentNavigationIndex - 1]
      : null;
  const nextItem =
    currentNavigationIndex >= 0 &&
    currentNavigationIndex < navigationItems.length - 1
      ? navigationItems[currentNavigationIndex + 1]
      : null;

  const navigateToView = (view: ViewState) => {
    if (view.type === 'overview') {
      setSelectedView(view);
      return;
    }

    setExpandedChapters((previous) => {
      const next = new Set(previous);
      next.add(view.chapterId);
      return next;
    });

    setSelectedView(view);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((previous) => {
      const next = new Set(previous);

      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }

      return next;
    });

    setSelectedView({ type: 'chapter', chapterId });
  };

  const openSubChapter = (chapterId: string, subChapterId: string) => {
    setExpandedChapters((previous) => {
      const next = new Set(previous);
      next.add(chapterId);
      return next;
    });

    setSelectedView({ type: 'subchapter', chapterId, subChapterId });
  };

  if (loading) {
    return (
      <div className={styles.pageShell}>
        <div className={styles.layout}>
          <main className={styles.contentPanel}>
            <p className={styles.contentDescription}>{t('detail.loadingCourse')}</p>
          </main>
        </div>
      </div>
    );
  }

  if (errorKey || !course || !selectedContent) {
    return (
      <div className={styles.pageShell}>
        <div className={styles.layout}>
          <main className={styles.contentPanel}>
            <p className={styles.contentDescription}>
              {errorKey === 'unableToLoad'
                ? t('detail.unableToLoad')
                : t('detail.courseNotFound')}
            </p>
          </main>
        </div>
      </div>
    );
  }

  const courseTitle = getLocalizedText(
    activeLanguage,
    course.titleEn,
    course.titleFi,
  );
  const overviewParagraphs = getOverviewParagraphs(activeLanguage, course);
  const heroSummary = overviewParagraphs[0] || selectedContent.description;
  const canReadContent =
    accessState === 'public' || accessState === 'granted';

  return (
    <div className={styles.pageShell}>
      <section
        className={styles.hero}
        style={{
          backgroundImage: `url(${course.coverImage || ''})`,
        }}
      >
        <div className={styles.heroInner}>
          <span className={styles.heroLabel}>
            {course.level === 'premium'
              ? t('detail.premiumCourse')
              : t('detail.freeCourse')}
          </span>
          <h1 className={styles.heroTitle}>{courseTitle}</h1>
          <p className={styles.heroSummary}>{heroSummary}</p>
        </div>
      </section>

      <div className={styles.layout}>
        <CourseSidebar
          course={course}
          activeLanguage={activeLanguage}
          selectedView={selectedView}
          expandedChapters={expandedChapters}
          overviewLabel={t('detail.overview')}
          heroSummary={heroSummary}
          onSelectOverview={() => setSelectedView({ type: 'overview' })}
          onToggleChapter={toggleChapter}
          onOpenSubChapter={openSubChapter}
        />

        <CourseContent
          course={course}
          activeLanguage={activeLanguage}
          selectedContent={selectedContent}
          accessState={accessState}
          canReadContent={canReadContent}
          courseAuthorFallback={courseAuthorFallback}
          previousItem={previousItem}
          nextItem={nextItem}
          onNavigateToView={navigateToView}
        />
      </div>
    </div>
  );
}
