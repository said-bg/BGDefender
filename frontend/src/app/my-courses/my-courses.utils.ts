import type { Course } from '@/services/courseService';
import type { CourseProgressSummary } from '@/services/progressService';

export type CourseFilter = 'all' | 'in_progress' | 'completed';

export type CourseWithProgress = Course & {
  chapterCount: number;
  itemCount: number;
  progressPercentage: number;
  completed: boolean;
  lastAccessedAt?: string;
};

export const getChapterAndItemCounts = (course: Course) => {
  const chapters = course.chapters || [];
  let totalItems = 0;

  chapters.forEach((chapter) => {
    totalItems += chapter.subChapters?.length ?? 0;
  });

  return {
    chapters: chapters.length,
    items: totalItems,
  };
};

// Merge public course data with saved progress rows so the UI can render
// a single stable list for "My Courses".
export const buildStartedCourses = (
  publishedCourses: Course[],
  progressRows: CourseProgressSummary[],
): CourseWithProgress[] => {
  const publishedCoursesById = new Map(
    publishedCourses.map((course) => [course.id, course]),
  );

  return progressRows
    .map((progress) => {
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
