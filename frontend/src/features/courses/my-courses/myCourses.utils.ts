import type { Course } from '@/services/course';
import type { CourseProgressSummary } from '@/services/progress';
import {
  CourseWithProgress,
  getChapterAndItemCounts,
  sortByLastAccessed,
} from '@/features/courses/lib/courseProgress.utils';

export { getChapterAndItemCounts };
export type { CourseWithProgress } from '@/features/courses/lib/courseProgress.utils';

export type CourseFilter = 'all' | 'in_progress' | 'completed';

// Merge public course data with saved progress rows so the UI can render
// a single stable list for "My Courses".
export const buildStartedCourses = (
  publishedCourses: Course[],
  progressRows: CourseProgressSummary[],
): CourseWithProgress[] => {
  const publishedCoursesById = new Map(
    publishedCourses.map((course) => [course.id, course]),
  );

  const mergedCourses: Array<CourseWithProgress | null> = progressRows.map((progress) => {
      const course = publishedCoursesById.get(progress.courseId);

      if (!course) {
        return null;
      }

      const { chapters, items } = getChapterAndItemCounts(course);

      return {
        ...course,
        chapterCount: chapters,
        itemCount: items,
        progressPercentage: progress.completionPercentage,
        completed: progress.completed || progress.completionPercentage >= 100,
        lastAccessedAt: progress.lastAccessedAt,
      } satisfies CourseWithProgress;
    });

  return sortByLastAccessed(
    mergedCourses.filter((course): course is CourseWithProgress => course !== null),
  );
};

export const filterMyCourses = (
  courses: CourseWithProgress[],
  activeFilter: CourseFilter,
) => {
  if (activeFilter === 'completed') {
    return courses.filter((course) => course.completed);
  }

  if (activeFilter === 'in_progress') {
    return courses.filter((course) => !course.completed);
  }

  return courses;
};

export const getMyCoursesSummary = (courses: CourseWithProgress[]) => {
  const completed = courses.filter((course) => course.completed).length;
  const inProgress = courses.filter((course) => !course.completed).length;

  return {
    all: courses.length,
    inProgress,
    completed,
  };
};

