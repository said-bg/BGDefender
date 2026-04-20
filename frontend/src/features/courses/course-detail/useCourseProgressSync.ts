import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import progressService from '@/services/progress';
import { User } from '@/types/api';
import {
  isCourseProgressSynced,
  NavigationItem,
  ViewState,
  getViewKey,
  getProgressPayloadFromView,
  getViewStateFromProgress,
  preserveCompletedProgress,
} from './courseDetail.utils';
import { Course } from '@/services/course';

interface UseCourseProgressSyncOptions {
  canReadContent: boolean;
  course: Course | null;
  courseId?: string;
  isAuthenticated: boolean;
  isInitialized: boolean;
  navigationItems: NavigationItem[];
  selectedView: ViewState;
  setExpandedChapters: Dispatch<SetStateAction<Set<string>>>;
  setSelectedView: Dispatch<SetStateAction<ViewState>>;
  user: User | null;
}

const getStoredCourseViewKey = (courseId: string) => `course-detail:view:${courseId}`;

const readStoredCourseView = (
  courseId: string,
  navigationItems: NavigationItem[],
): ViewState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(getStoredCourseViewKey(courseId));
  if (!rawValue) {
    return null;
  }

  try {
    const parsedView = JSON.parse(rawValue) as ViewState;
    const viewKey = getViewKey(parsedView);
    return navigationItems.some((item) => item.key === viewKey) ? parsedView : null;
  } catch {
    return null;
  }
};

const writeStoredCourseView = (courseId: string, selectedView: ViewState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(
    getStoredCourseViewKey(courseId),
    JSON.stringify(selectedView),
  );
};

export default function useCourseProgressSync({
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
}: UseCourseProgressSyncOptions) {
  const [savedProgress, setSavedProgress] = useState<Awaited<
    ReturnType<typeof progressService.getMyCourseProgress>
  > | null>(null);
  const [restoringProgress, setRestoringProgress] = useState(false);
  const [hasRestoredInitialView, setHasRestoredInitialView] = useState(false);

  useEffect(() => {
    setSavedProgress(null);
    setHasRestoredInitialView(false);
  }, [courseId]);

  useEffect(() => {
    if (!courseId || !hasRestoredInitialView) {
      return;
    }

    writeStoredCourseView(courseId, selectedView);
  }, [courseId, hasRestoredInitialView, selectedView]);

  useEffect(() => {
    if (!courseId || !course || !isInitialized || !isAuthenticated || !user) {
      return;
    }

    let isMounted = true;

    const restoreProgress = async () => {
      try {
        setRestoringProgress(true);
        const restoredSessionView = readStoredCourseView(courseId, navigationItems);

        if (restoredSessionView) {
          if (
            restoredSessionView.type !== 'overview' &&
            restoredSessionView.type !== 'final-test'
          ) {
            setExpandedChapters(new Set([restoredSessionView.chapterId]));
          }

          setSelectedView(restoredSessionView);
        }

        const progress = await progressService.getMyCourseProgress(courseId);
        setSavedProgress(progress);

        if (!isMounted || !progress || restoredSessionView) {
          return;
        }

        const restoredView = getViewStateFromProgress(progress);

        if (restoredView.type !== 'overview' && restoredView.type !== 'final-test') {
          setExpandedChapters(new Set([restoredView.chapterId]));
        }

        setSelectedView(restoredView);
      } catch (restoreError) {
        console.error('Failed to restore course progress:', restoreError);
      } finally {
        if (isMounted) {
          setRestoringProgress(false);
          setHasRestoredInitialView(true);
        }
      }
    };

    void restoreProgress();

    return () => {
      isMounted = false;
    };
  }, [
    course,
    courseId,
    isAuthenticated,
    isInitialized,
    navigationItems,
    setExpandedChapters,
    setSelectedView,
    user,
  ]);

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

    const payload = preserveCompletedProgress(
      savedProgress,
      getProgressPayloadFromView(navigationItems, selectedView),
    );

    if (isCourseProgressSynced(savedProgress, payload)) {
      return;
    }

    void progressService
      .saveMyCourseProgress(courseId, payload)
      .then((updatedProgress) => {
        setSavedProgress(updatedProgress);
      })
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
    savedProgress,
    selectedView,
    user,
  ]);

  return { restoringProgress };
}
