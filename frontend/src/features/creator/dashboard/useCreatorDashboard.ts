'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, {
  AdminCourseSummary,
  Course,
  CourseLearningSummary,
} from '@/services/course';

type CreatorDashboardState = {
  summary: AdminCourseSummary | null;
  learningSummary: CourseLearningSummary | null;
  courses: Course[];
  loading: boolean;
  error: string | null;
};

export default function useCreatorDashboard() {
  const { t } = useTranslation('admin');
  const [state, setState] = useState<CreatorDashboardState>({
    summary: null,
    learningSummary: null,
    courses: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadCreatorData() {
      try {
        setState((previous) => ({ ...previous, loading: true, error: null }));

        const [summary, learningSummary, coursesResponse] = await Promise.all([
          courseService.getAdminSummary('mine'),
          courseService.getAdminLearningSummary('mine'),
          courseService.getAdminCourses(6, 0, 'mine'),
        ]);

        setState({
          summary,
          learningSummary,
          courses: coursesResponse.data,
          loading: false,
          error: null,
        });
      } catch {
        setState((previous) => ({
          ...previous,
          loading: false,
          error: t('failedToLoad'),
        }));
      }
    }

    void loadCreatorData();
  }, [t]);

  return state;
}
