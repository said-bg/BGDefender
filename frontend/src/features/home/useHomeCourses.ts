'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import courseService, { Course } from '@/services/courseService';
import progressService from '@/services/progressService';
import { UserPlan, UserRole } from '@/types/api';
import { HomeCourse } from './types';

interface CoursesState {
  inProgress: HomeCourse[];
  free: HomeCourse[];
  premium: HomeCourse[];
  loading: boolean;
  error: string | null;
}

const truncateText = (value: string, maxLength = 96) => {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength).trim()}...`;
};

const getChapterAndItemCounts = (course: Course) => {
  const chapters = course.chapters || [];
  let totalItems = 0;

  chapters.forEach((chapter) => {
    totalItems += (chapter.subChapters || []).length;
  });

  return {
    chapters: chapters.length,
    items: totalItems,
  };
};

export default function useHomeCourses() {
  const { i18n, t } = useTranslation('courses');
  const { isAuthenticated, isInitialized, user } = useAuth();
  const [courses, setCourses] = useState<CoursesState>({
    inProgress: [],
    free: [],
    premium: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCourses((prev) => ({ ...prev, loading: true, error: null }));
        const [response, progressRows] = await Promise.all([
          courseService.getPublishedCourses(50, 0),
          isAuthenticated
            ? progressService.getMyProgress()
            : Promise.resolve([] as Awaited<ReturnType<typeof progressService.getMyProgress>>),
        ]);

        const progressByCourseId = new Map(
          progressRows.map((progress) => [progress.courseId, progress]),
        );

        const coursesWithStats: HomeCourse[] = response.data.map((course) => {
          const { chapters, items } = getChapterAndItemCounts(course);
          const progress = progressByCourseId.get(course.id);

          return {
            ...course,
            chapterCount: chapters,
            itemCount: items,
            progressPercentage: progress?.completionPercentage ?? 0,
            lastAccessedAt: progress?.lastAccessedAt,
          };
        });

        setCourses({
          inProgress: coursesWithStats
            .filter((course) => course.progressPercentage > 0 && course.progressPercentage < 100)
            .sort((left, right) => {
              const leftTime = left.lastAccessedAt ? new Date(left.lastAccessedAt).getTime() : 0;
              const rightTime = right.lastAccessedAt ? new Date(right.lastAccessedAt).getTime() : 0;

              return rightTime - leftTime;
            }),
          free: coursesWithStats.filter((course) => course.level === 'free'),
          premium: coursesWithStats.filter((course) => course.level === 'premium'),
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to load courses:', error);
        setCourses((prev) => ({
          ...prev,
          loading: false,
          error: t('page.failedToLoadCourses'),
        }));
      }
    };

    if (isInitialized) {
      void loadCourses();
    }
  }, [isAuthenticated, isInitialized, t]);

  const getTitle = (course: HomeCourse) => (i18n.language === 'fi' ? course.titleFi : course.titleEn);

  const getCardDescription = (course: HomeCourse) => {
    const localizedDescription = i18n.language === 'fi' ? course.descriptionFi : course.descriptionEn;
    const fallbackDescription = i18n.language === 'fi' ? course.descriptionEn : course.descriptionFi;

    return truncateText(localizedDescription || fallbackDescription || '');
  };

  const canAccessCourse = (course: HomeCourse) => {
    if (course.level === 'free') {
      return true;
    }

    return user?.plan === UserPlan.PREMIUM || user?.role === UserRole.ADMIN;
  };

  return {
    courses,
    getCardDescription,
    getTitle,
    isAuthenticated,
    visibleInProgressCourses: courses.inProgress.filter(canAccessCourse),
  };
}