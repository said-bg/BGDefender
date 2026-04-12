import type { Course } from '@/services/course';
import type { FavoriteSummary } from '@/services/favorites';
import type { CourseProgressSummary } from '@/services/progress';
import {
  CourseWithProgress,
  getChapterAndItemCounts,
  sortByLastAccessed,
} from '@/features/courses/lib/courseProgress.utils';

// Combine favorites, public course data, and progress rows into one stable list
// so the page can render accurate badges, counts, and resume state.
export const buildFavoriteCourses = (
  publishedCourses: Course[],
  favoriteRows: FavoriteSummary[],
  progressRows: CourseProgressSummary[],
): CourseWithProgress[] => {
  const publishedCoursesById = new Map(
    publishedCourses.map((course) => [course.id, course]),
  );
  const progressByCourseId = new Map(
    progressRows.map((progress) => [progress.courseId, progress]),
  );

  const mergedCourses: Array<CourseWithProgress | null> = favoriteRows.map((favorite) => {
      const course = publishedCoursesById.get(favorite.courseId) ?? favorite.course;

      if (!course) {
        return null;
      }

      const { chapters, items } = getChapterAndItemCounts(course);
      const progress = progressByCourseId.get(course.id);

      return {
        ...course,
        chapterCount: chapters,
        itemCount: items,
        progressPercentage: progress?.completionPercentage ?? 0,
        completed: progress?.completed || progress?.completionPercentage === 100,
        lastAccessedAt: progress?.lastAccessedAt ?? favorite.createdAt,
      } satisfies CourseWithProgress;
    });

  return sortByLastAccessed(
    mergedCourses.filter((course): course is CourseWithProgress => course !== null),
  );
};

