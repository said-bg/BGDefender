import { useEffect, useMemo, useState } from 'react';
import courseService from '@/services/course';
import progressService from '@/services/progress';
import {
  CourseFilter,
  CourseWithProgress,
  buildStartedCourses,
  filterMyCourses,
  getMyCoursesSummary,
} from './myCourses.utils';

type MyCoursesState = {
  courses: CourseWithProgress[];
  error: string | null;
  loading: boolean;
};

export default function useMyCoursesPage(
  isInitialized: boolean,
  isAuthenticated: boolean,
  errorMessage: string,
) {
  const [activeFilter, setActiveFilter] = useState<CourseFilter>('all');
  const [state, setState] = useState<MyCoursesState>({
    courses: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      return;
    }

    const loadMyCourses = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: null }));

        const [response, progressRows] = await Promise.all([
          courseService.getPublishedCourses(100, 0),
          progressService.getMyProgress(),
        ]);

        setState({
          courses: buildStartedCourses(response.data, progressRows),
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to load my courses:', error);
        setState({
          courses: [],
          loading: false,
          error: errorMessage,
        });
      }
    };

    void loadMyCourses();
  }, [errorMessage, isAuthenticated, isInitialized]);

  const filteredCourses = useMemo(
    () => filterMyCourses(state.courses, activeFilter),
    [activeFilter, state.courses],
  );
  const summary = useMemo(() => getMyCoursesSummary(state.courses), [state.courses]);

  return {
    activeFilter,
    filteredCourses,
    setActiveFilter,
    state,
    summary,
  };
}

