'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import certificateService from '@/services/certificates';
import collectionService from '@/services/collections';
import courseService, { Course } from '@/services/course';
import progressService from '@/services/progress';
import { CertificateStatus, UserPlan, UserRole } from '@/types/api';
import { HomeCourse, HomeCourseCollection } from '../lib/home.types';
import { getHomeWelcomeName, isProfileComplete } from '../lib/home.utils';

interface CoursesState {
  inProgress: HomeCourse[];
  free: HomeCourse[];
  premium: HomeCourse[];
  collections: HomeCourseCollection[];
  issuedCertificates: number;
  pendingCertificates: number;
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
  const mapCourseWithStats = (
    course: Course,
    progressByCourseId: Map<number | string, Awaited<ReturnType<typeof progressService.getMyProgress>>[number]>,
  ): HomeCourse => {
    const { chapters, items } = getChapterAndItemCounts(course);
    const progress = progressByCourseId.get(course.id);

    return {
      ...course,
      chapterCount: chapters,
      itemCount: items,
      progressPercentage: progress?.completionPercentage ?? 0,
      lastAccessedAt: progress?.lastAccessedAt,
    };
  };
  const [courses, setCourses] = useState<CoursesState>({
    inProgress: [],
    free: [],
    premium: [],
    collections: [],
    issuedCertificates: 0,
    pendingCertificates: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCourses((prev) => ({ ...prev, loading: true, error: null }));
        const [response, progressRows, certificateRows, collectionRows] = await Promise.all([
          courseService.getPublishedCourses(50, 0),
          isAuthenticated
            ? progressService.getMyProgress()
            : Promise.resolve([] as Awaited<ReturnType<typeof progressService.getMyProgress>>),
          isAuthenticated && user?.role !== UserRole.ADMIN
            ? certificateService.getMyCertificates()
            : Promise.resolve([] as Awaited<ReturnType<typeof certificateService.getMyCertificates>>),
          collectionService.getPublishedCollections(),
        ]);

        const progressByCourseId = new Map(
          progressRows.map((progress) => [progress.courseId, progress]),
        );

        const coursesWithStats: HomeCourse[] = response.data.map((course) =>
          mapCourseWithStats(course, progressByCourseId),
        );
        const collectionsWithStats: HomeCourseCollection[] = collectionRows.map((collection) => ({
          ...collection,
          courses: collection.courses.map((course) =>
            mapCourseWithStats(course, progressByCourseId),
          ),
        }));

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
          issuedCertificates: certificateRows.filter(
            (certificate) => certificate.status === CertificateStatus.ISSUED,
          ).length,
          pendingCertificates: certificateRows.filter(
            (certificate) => certificate.status === CertificateStatus.PENDING_PROFILE,
          ).length,
          collections: collectionsWithStats,
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
  }, [isAuthenticated, isInitialized, t, user?.role]);

  const getTitle = (course: HomeCourse) => (i18n.language === 'fi' ? course.titleFi : course.titleEn);

  const getCardDescription = (course: HomeCourse) => {
    const localizedDescription = i18n.language === 'fi' ? course.descriptionFi : course.descriptionEn;
    const fallbackDescription = i18n.language === 'fi' ? course.descriptionEn : course.descriptionFi;

    return truncateText(localizedDescription || fallbackDescription || '');
  };

  const getCollectionTitle = (collection: HomeCourseCollection) =>
    i18n.language === 'fi' ? collection.titleFi : collection.titleEn;

  const getCollectionDescription = (collection: HomeCourseCollection) => {
    const localizedDescription =
      i18n.language === 'fi' ? collection.descriptionFi : collection.descriptionEn;
    const fallbackDescription =
      i18n.language === 'fi' ? collection.descriptionEn : collection.descriptionFi;

    return (localizedDescription || fallbackDescription || '').trim();
  };

  const canAccessCourse = (course: HomeCourse) => {
    if (course.level === 'free') {
      return true;
    }

    return user?.plan === UserPlan.PREMIUM || user?.role === UserRole.ADMIN;
  };

  return {
    courses,
    getCollectionDescription,
    getCollectionTitle,
    getCardDescription,
    getTitle,
    hasAnyLearnerActivity:
      courses.inProgress.length > 0 ||
      courses.issuedCertificates > 0 ||
      courses.pendingCertificates > 0,
    isAuthenticated,
    isLearnerHome:
      isAuthenticated && isInitialized && user?.role !== UserRole.ADMIN,
    hasIncompleteProfile: Boolean(user) && !isProfileComplete(user),
    welcomeName: getHomeWelcomeName(user),
    user,
    visibleInProgressCourses: courses.inProgress.filter(canAccessCourse),
  };
}

