import { apiClient } from '../api';
import type { Course } from '../course';

export interface FavoriteSummary {
  id: string;
  userId: number;
  courseId: string;
  createdAt: string;
  course?: Course;
}

const FAVORITE_ENDPOINTS = {
  ME: '/favorites/me',
  course: (courseId: string) => `/favorites/me/course/${courseId}`,
};

/**
 * Fetch every favorite row for the authenticated user.
 */
export const getMyFavorites = async (): Promise<FavoriteSummary[]> => {
  const response = await apiClient.get<FavoriteSummary[]>(FAVORITE_ENDPOINTS.ME);
  return response.data;
};

/**
 * Fetch the favorite state for a single course for the authenticated user.
 */
export const getMyCourseFavorite = async (
  courseId: string,
): Promise<FavoriteSummary | null> => {
  const response = await apiClient.get<FavoriteSummary | null>(
    FAVORITE_ENDPOINTS.course(courseId),
  );
  return response.data;
};

/**
 * Add a course to the authenticated user's favorites.
 */
export const addMyCourseFavorite = async (
  courseId: string,
): Promise<FavoriteSummary> => {
  const response = await apiClient.put<FavoriteSummary>(
    FAVORITE_ENDPOINTS.course(courseId),
  );
  return response.data;
};

/**
 * Remove a course from the authenticated user's favorites.
 */
export const removeMyCourseFavorite = async (courseId: string): Promise<void> => {
  await apiClient.delete(FAVORITE_ENDPOINTS.course(courseId));
};

const favoriteService = {
  getMyFavorites,
  getMyCourseFavorite,
  addMyCourseFavorite,
  removeMyCourseFavorite,
};

export default favoriteService;
