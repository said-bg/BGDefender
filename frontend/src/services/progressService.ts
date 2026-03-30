import { apiClient } from './api';

export type ProgressViewType = 'overview' | 'chapter' | 'subchapter';

export interface CourseProgress {
  id: string;
  userId: number;
  courseId: string;
  completionPercentage: number;
  completed: boolean;
  completedAt: string | null;
  lastAccessedAt: string;
  lastViewedType: ProgressViewType | null;
  lastChapterId: string | null;
  lastSubChapterId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgressSummary extends CourseProgress {
  course?: {
    id: string;
    titleEn: string;
    titleFi: string;
    descriptionEn: string;
    descriptionFi: string;
    level: 'free' | 'premium';
    status: string;
    estimatedDuration: number | null;
    coverImage: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface SaveCourseProgressRequest {
  completionPercentage: number;
  lastViewedType: ProgressViewType;
  lastChapterId?: string;
  lastSubChapterId?: string;
}

const PROGRESS_ENDPOINTS = {
  ME: '/progress/me',
  course: (courseId: string) => `/progress/me/course/${courseId}`,
};

/**
 * Fetch every progress row for the authenticated user.
 */
export const getMyProgress = async (): Promise<CourseProgressSummary[]> => {
  const response =
    await apiClient.get<CourseProgressSummary[]>(PROGRESS_ENDPOINTS.ME);
  return response.data;
};

/**
 * Fetch progress for a single course for the authenticated user.
 */
export const getMyCourseProgress = async (
  courseId: string,
): Promise<CourseProgress | null> => {
  const response = await apiClient.get<CourseProgress | null>(
    PROGRESS_ENDPOINTS.course(courseId),
  );
  return response.data;
};

/**
 * Create or update the authenticated user's progress for a course.
 */
export const saveMyCourseProgress = async (
  courseId: string,
  data: SaveCourseProgressRequest,
): Promise<CourseProgress> => {
  const response = await apiClient.put<CourseProgress>(
    PROGRESS_ENDPOINTS.course(courseId),
    data,
  );
  return response.data;
};

const progressService = {
  getMyProgress,
  getMyCourseProgress,
  saveMyCourseProgress,
};

export default progressService;
