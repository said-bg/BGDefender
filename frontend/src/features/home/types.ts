import { Course } from '@/services/courseService';

export interface HomeCourse extends Course {
  chapterCount: number;
  itemCount: number;
  progressPercentage: number;
  lastAccessedAt?: string;
}
