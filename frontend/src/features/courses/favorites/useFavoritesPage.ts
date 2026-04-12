import { useEffect, useMemo, useState } from 'react';
import { useFavoriteCourses } from '@/hooks';
import courseService, { Course } from '@/services/course';
import type { FavoriteSummary } from '@/services/favorites';
import progressService from '@/services/progress';
import { buildFavoriteCourses } from './favoriteCourses.utils';

type FavoriteCoursesState = {
  courses: Course[];
  error: string | null;
  loading: boolean;
  progressRows: Awaited<ReturnType<typeof progressService.getMyProgress>>;
};

export default function useFavoritesPage(errorMessage: string) {
  const { favorites, isLoading: loadingFavorites, toggleFavorite } = useFavoriteCourses();
  const [state, setState] = useState<FavoriteCoursesState>({
    courses: [],
    progressRows: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadFavoritePageData = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: null }));

        const [response, progressRows] = await Promise.all([
          courseService.getPublishedCourses(100, 0),
          progressService.getMyProgress(),
        ]);

        setState({
          courses: response.data,
          progressRows,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to load favorites page:', error);
        setState({
          courses: [],
          progressRows: [],
          loading: false,
          error: errorMessage,
        });
      }
    };

    void loadFavoritePageData();
  }, [errorMessage]);

  const favoriteCourses = useMemo(
    () => buildFavoriteCourses(state.courses, favorites as FavoriteSummary[], state.progressRows),
    [favorites, state.courses, state.progressRows],
  );

  return {
    favoriteCourses,
    loading: state.loading || loadingFavorites,
    error: state.error,
    toggleFavorite,
  };
}

