import type { Course } from '@/services/courseService';
import type { FavoriteSummary } from '@/services/favoriteService';
import type { CourseProgressSummary } from '@/services/progressService';
import {
  CourseWithProgress,
  getChapterAndItemCounts,
} from '@/app/my-courses/my-courses.utils';

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

  return favoriteRows
    .map((favorite) => {
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
    })
    .filter((course): course is CourseWithProgress => Boolean(course))
    .sort((left, right) => {
      const leftTime = left.lastAccessedAt
        ? new Date(left.lastAccessedAt).getTime()
        : 0;
      const rightTime = right.lastAccessedAt
        ? new Date(right.lastAccessedAt).getTime()
        : 0;

      return rightTime - leftTime;
    });
};
