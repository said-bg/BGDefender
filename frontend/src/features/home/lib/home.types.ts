import { Course, CourseCollection } from '@/services/course';

export interface HomeCourse extends Course {
  chapterCount: number;
  itemCount: number;
  progressPercentage: number;
  lastAccessedAt?: string;
}

export interface HomeCourseCollection extends Omit<CourseCollection, 'courses'> {
  courses: HomeCourse[];
}

