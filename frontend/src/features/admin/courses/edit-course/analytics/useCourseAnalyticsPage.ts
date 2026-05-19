'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import courseService, {
  type AdminFinalTestAnalytics,
  type AdminQuizAnalytics,
  type Course,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { useEditCourseId } from '@/features/admin/courses/edit-course/shared/EditCourseShared';

type ChapterAnalyticsEntry = {
  chapter: Course['chapters'][number];
  analytics: AdminQuizAnalytics | null;
};

const sortCourseChapters = (course: Course): Course['chapters'] =>
  [...course.chapters].sort((left, right) => left.orderIndex - right.orderIndex);

export default function useCourseAnalyticsPage(
  language: string,
  t: TFunction<'admin', undefined>,
) {
  const courseId = useEditCourseId();
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [finalTestAnalytics, setFinalTestAnalytics] =
    useState<AdminFinalTestAnalytics | null>(null);
  const [chapterAnalytics, setChapterAnalytics] = useState<ChapterAnalyticsEntry[]>([]);

  useEffect(() => {
    if (!courseId) {
      setLoadError(t('edit.missingCourseId'));
      setLoadingPage(false);
      return;
    }

    const loadCourse = async () => {
      try {
        setLoadingPage(true);
        setLoadError(null);
        const response = await courseService.getAdminCourseById(courseId);
        setCourse(response);
      } catch (error) {
        setLoadError(getApiErrorMessage(error, t('edit.failedToLoad')));
      } finally {
        setLoadingPage(false);
      }
    };

    void loadCourse();
  }, [courseId, t]);

  useEffect(() => {
    if (!courseId || !course) {
      setFinalTestAnalytics(null);
      setChapterAnalytics([]);
      return;
    }

    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);

        const chapters = sortCourseChapters(course);
        const [finalTestResponse, chapterResponses] = await Promise.all([
          courseService.getCourseFinalTestAnalytics(courseId),
          Promise.all(
            chapters.map(async (chapter) => ({
              chapter,
              analytics: await courseService.getChapterQuizAnalytics(courseId, chapter.id),
            })),
          ),
        ]);

        setFinalTestAnalytics(finalTestResponse);
        setChapterAnalytics(chapterResponses);
      } catch (error) {
        setAnalyticsError(
          getApiErrorMessage(error, t('edit.quiz.failedToLoad')),
        );
        setFinalTestAnalytics(null);
        setChapterAnalytics([]);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    void loadAnalytics();
  }, [course, courseId, t]);

  const localizedCourseTitle = useMemo(() => {
    if (!course) {
      return '';
    }

    return language === 'fi' ? course.titleFi : course.titleEn;
  }, [course, language]);

  return {
    analyticsError,
    analyticsLoading,
    chapterAnalytics,
    course,
    courseId,
    finalTestAnalytics,
    loadError,
    loadingPage,
    localizedCourseTitle,
  };
}
