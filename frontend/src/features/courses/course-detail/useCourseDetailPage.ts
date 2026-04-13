import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import courseService, { Course } from '@/services/course';
import { useAuth, useFavoriteCourses } from '@/hooks';
import { UserPlan, UserRole } from '@/types/api';
import {
  ActiveLanguage,
  NavigationItem,
  SelectedContent,
  ViewState,
  buildNavigationItems,
  formatCourseDuration,
  getLocalizedText,
  getOverviewParagraphs,
  getSelectedContent,
} from './courseDetail.utils';
import type { CourseAccessState, CourseDetailErrorKey } from './courseDetail.types';
import useCourseProgressSync from './useCourseProgressSync';

export function useCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const { i18n, t } = useTranslation('courses');
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { isFavorite, isPending, toggleFavorite } = useFavoriteCourses();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<CourseDetailErrorKey>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [selectedView, setSelectedView] = useState<ViewState>({ type: 'overview' });

  const courseId = Array.isArray(params?.courseId)
    ? params.courseId[0]
    : params?.courseId;
  const activeLanguage: ActiveLanguage = i18n.language === 'fi' ? 'fi' : 'en';
  const courseAuthorFallback = t('detail.courseAuthor');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [courseId]);

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

  const accessState = useMemo<CourseAccessState>(() => {
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

  const canReadContent = accessState === 'public' || accessState === 'granted';
  const canAccessAssessments = useMemo(() => {
    if (!isInitialized || !isAuthenticated || !user) {
      return false;
    }

    if (
      course?.level === 'premium' &&
      user.plan !== UserPlan.PREMIUM &&
      user.role !== UserRole.ADMIN
    ) {
      return false;
    }

    return true;
  }, [course?.level, isAuthenticated, isInitialized, user]);

  const navigationItems = useMemo<NavigationItem[]>(() => {
    if (!course) {
      return [];
    }

    return buildNavigationItems(course);
  }, [course]);

  const currentViewKey =
    selectedView.type === 'overview'
      ? 'overview'
      : selectedView.type === 'final-test'
        ? 'final-test'
      : selectedView.type === 'chapter'
        ? `chapter:${selectedView.chapterId}`
        : `subchapter:${selectedView.subChapterId}`;
  const currentNavigationIndex = navigationItems.findIndex((item) => item.key === currentViewKey);
  const previousItem =
    selectedView.type === 'final-test'
      ? navigationItems[navigationItems.length - 1] ?? null
      : currentNavigationIndex > 0
        ? navigationItems[currentNavigationIndex - 1]
        : null;
  const nextItem =
    selectedView.type === 'final-test'
      ? null
      : currentNavigationIndex >= 0 && currentNavigationIndex < navigationItems.length - 1
        ? navigationItems[currentNavigationIndex + 1]
        : null;

  const navigateToView = (view: ViewState) => {
    if (view.type === 'overview') {
      setSelectedView(view);
      return;
    }

    setExpandedChapters((previous) => new Set(previous).add(view.chapterId));
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
    setExpandedChapters((previous) => new Set(previous).add(chapterId));
    setSelectedView({ type: 'subchapter', chapterId, subChapterId });
  };

  const openQuiz = (chapterId: string) => {
    setExpandedChapters((previous) => new Set(previous).add(chapterId));
    setSelectedView({ type: 'quiz', chapterId });
  };

  const openFinalTest = () => {
    setSelectedView({ type: 'final-test' });
  };

  useCourseProgressSync({
    canReadContent,
    course,
    courseId,
    isAuthenticated,
    isInitialized,
    navigationItems,
    selectedView,
    setExpandedChapters,
    setSelectedView,
    user,
  });

  const courseTitle = course
    ? getLocalizedText(activeLanguage, course.titleEn, course.titleFi)
    : '';
  const overviewParagraphs = course ? getOverviewParagraphs(activeLanguage, course) : [];
  const heroSummary = overviewParagraphs[0] || selectedContent?.description || '';
  const durationLabel = formatCourseDuration(course?.estimatedDuration);

  return {
    accessState,
    activeLanguage,
    canAccessAssessments,
    canReadContent,
    course,
    courseAuthorFallback,
    courseTitle,
    durationLabel,
    errorKey,
    expandedChapters,
    heroSummary,
    isAuthenticated,
    isFavorite,
    isPending,
    loading,
    nextItem,
    openFinalTest,
    openQuiz,
    openSubChapter,
    previousItem,
    selectedContent,
    selectedView,
    t,
    toggleChapter,
    toggleFavorite,
    navigateToView,
  };
}

