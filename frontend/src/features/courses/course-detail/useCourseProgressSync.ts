import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import progressService from '@/services/progressService';
import { User } from '@/types/api';
import {
  NavigationItem,
  ViewState,
  getProgressPayloadFromView,
  getViewStateFromProgress,
  preserveCompletedProgress,
} from './courseDetail.utils';
import { Course } from '@/services/courseService';

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

  useEffect(() => {
    setSavedProgress(null);
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
        setSavedProgress(progress);

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
  }, [
    course,
    courseId,
    isAuthenticated,
    isInitialized,
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
