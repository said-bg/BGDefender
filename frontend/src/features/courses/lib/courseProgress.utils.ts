import type { Course } from '@/services/course';

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

export const sortByLastAccessed = (courses: CourseWithProgress[]) =>
  courses.sort((left, right) => {
    const leftTime = left.lastAccessedAt ? new Date(left.lastAccessedAt).getTime() : 0;
    const rightTime = right.lastAccessedAt ? new Date(right.lastAccessedAt).getTime() : 0;

    return rightTime - leftTime;
  });

