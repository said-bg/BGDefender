'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import styles from '../course-page.module.css';
import FavoriteButton from '@/components/FavoriteButton';
import courseService, { Course } from '@/services/courseService';
import progressService from '@/services/progressService';
import { useAuth, useFavoriteCourses } from '@/hooks';
import { UserPlan, UserRole } from '@/types/api';
import { CourseContent } from '../components/CourseContent';
import { CourseSidebar } from '../components/CourseSidebar';
import {
  ActiveLanguage,
  NavigationItem,
  SelectedContent,
  ViewState,
  buildNavigationItems,
  getProgressPayloadFromView,
  getLocalizedText,
  getOverviewParagraphs,
  getSelectedContent,
  getViewStateFromProgress,
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
  const { isFavorite, isPending, toggleFavorite } = useFavoriteCourses();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<ErrorKey>(null);
  const [restoringProgress, setRestoringProgress] = useState(false);
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

  useEffect(() => {
    if (!courseId || !course || !isInitialized || !isAuthenticated || !user) {
      return;
    }

    let isMounted = true;

    const restoreProgress = async () => {
      try {
        setRestoringProgress(true);
        const progress = await progressService.getMyCourseProgress(courseId);

        if (!isMounted || !progress) {
          return;
        }

        const restoredView = getViewStateFromProgress(progress);

        if (restoredView.type !== 'overview') {
          setExpandedChapters(new Set([restoredView.chapterId]));
        }

        setSelectedView(restoredView);
      } catch (restoreError) {
        console.error('Failed to restore course progress:', restoreError);
      } finally {
        if (isMounted) {
          setRestoringProgress(false);
        }
      }
    };

    void restoreProgress();

    return () => {
      isMounted = false;
    };
  }, [courseId, course, isAuthenticated, isInitialized, user]);

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

  const canReadContent =
    accessState === 'public' || accessState === 'granted';

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

  useEffect(() => {
    if (
      !courseId ||
      !course ||
      !isInitialized ||
      !isAuthenticated ||
      !user ||
      restoringProgress ||
      !canReadContent ||
      selectedView.type === 'overview'
    ) {
      return;
    }

    const payload = getProgressPayloadFromView(navigationItems, selectedView);

    void progressService
      .saveMyCourseProgress(courseId, payload)
      .catch((saveError) => {
        console.error('Failed to save course progress:', saveError);
      });
  }, [
    canReadContent,
    course,
    courseId,
    isAuthenticated,
    isInitialized,
    navigationItems,
    restoringProgress,
    selectedView,
    user,
  ]);

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

  return (
    <div className={styles.pageShell}>
      <section className={styles.hero}>
        {course.coverImage ? (
          <Image
            src={course.coverImage}
            alt={courseTitle}
            fill
            priority
            className={styles.heroBackground}
            sizes="100vw"
          />
        ) : (
          <div className={styles.heroFallback} />
        )}
        <div className={styles.heroInner}>
          <div className={styles.heroTopRow}>
            <span className={styles.heroLabel}>
              {course.level === 'premium'
                ? t('detail.premiumCourse')
                : t('detail.freeCourse')}
            </span>
            {isAuthenticated && (
              <FavoriteButton
                active={isFavorite(course.id)}
                pending={isPending(course.id)}
                onToggle={() => void toggleFavorite(course.id)}
                addLabel={t('favorites.add')}
                removeLabel={t('favorites.remove')}
                visibleLabel={t('favorites.title')}
                variant="pill"
                className={styles.heroFavoriteButton}
              />
            )}
          </div>
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
