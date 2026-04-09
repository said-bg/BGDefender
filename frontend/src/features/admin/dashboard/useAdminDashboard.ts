'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, { AdminCourseSummary, Course } from '@/services/courseService';

type AdminDashboardState = {
  summary: AdminCourseSummary | null;
  courses: Course[];
  loading: boolean;
  error: string | null;
};

export default function useAdminDashboard() {
  const { t } = useTranslation('admin');
  const [state, setState] = useState<AdminDashboardState>({
    summary: null,
    courses: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadAdminData() {
      try {
        setState((previous) => ({ ...previous, loading: true, error: null }));

        const [summary, coursesResponse] = await Promise.all([
          courseService.getAdminSummary(),
          courseService.getAdminCourses(6, 0),
        ]);

        setState({
          summary,
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

    void loadAdminData();
  }, [t]);

  return {
    ...state,
  };
}
