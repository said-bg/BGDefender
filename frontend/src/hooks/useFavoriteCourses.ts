'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import favoriteService, { FavoriteSummary } from '@/services/favoriteService';
import { useAuth } from './useAuth';

export const useFavoriteCourses = () => {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCourseIds, setPendingCourseIds] = useState<string[]>([]);

  const favoriteCourseIds = useMemo(
    () => favorites.map((favorite) => favorite.courseId),
    [favorites],
  );

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated || !isInitialized) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const favoriteRows = await favoriteService.getMyFavorites();
      setFavorites(favoriteRows);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isInitialized]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (courseId: string) => favoriteCourseIds.includes(courseId),
    [favoriteCourseIds],
  );

  const isPending = useCallback(
    (courseId: string) => pendingCourseIds.includes(courseId),
    [pendingCourseIds],
  );

  const toggleFavorite = useCallback(
    async (courseId: string) => {
      if (!isAuthenticated || !user || isPending(courseId)) {
        return;
      }

      const wasFavorite = favoriteCourseIds.includes(courseId);
      const optimisticFavorite: FavoriteSummary = {
        id: `temp-${courseId}`,
        userId: user.id,
        courseId,
        createdAt: new Date().toISOString(),
      };

      setPendingCourseIds((previous) => [...previous, courseId]);
      setFavorites((previous) =>
        wasFavorite
          ? previous.filter((favorite) => favorite.courseId !== courseId)
          : [optimisticFavorite, ...previous],
      );

      try {
        if (wasFavorite) {
          await favoriteService.removeMyCourseFavorite(courseId);
        } else {
          const favorite = await favoriteService.addMyCourseFavorite(courseId);
          setFavorites((previous) => [
            favorite,
            ...previous.filter(
              (existingFavorite) => existingFavorite.courseId !== courseId,
            ),
          ]);
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        setFavorites((previous) =>
          wasFavorite
            ? [optimisticFavorite, ...previous]
            : previous.filter((favorite) => favorite.courseId !== courseId),
        );
      } finally {
        setPendingCourseIds((previous) =>
          previous.filter((pendingCourseId) => pendingCourseId !== courseId),
        );
      }
    },
    [favoriteCourseIds, isAuthenticated, isPending, user],
  );

  return {
    favorites,
    favoriteCourseIds,
    isLoading,
    isFavorite,
    isPending,
    toggleFavorite,
    refreshFavorites: loadFavorites,
  };
};

export default useFavoriteCourses;
