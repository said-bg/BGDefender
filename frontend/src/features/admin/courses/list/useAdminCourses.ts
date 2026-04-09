'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, { AdminCourseSummary, Course } from '@/services/courseService';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  formatAdminCourseLevel,
  formatAdminCourseStatus,
  formatAdminUpdatedAt,
  toLocalizedCourse,
  updateSummaryForDelete,
  updateSummaryForStatusChange,
} from './courseAdmin.utils';

type AdminCoursesState = {
  summary: AdminCourseSummary | null;
  courses: Course[];
  loading: boolean;
  error: string | null;
};

export default function useAdminCourses() {
  const { t, i18n } = useTranslation('admin');
  const [state, setState] = useState<AdminCoursesState>({
    summary: null,
    courses: [],
    loading: true,
    error: null,
  });
  const [actingCourseId, setActingCourseId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadAdminCourses = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: null }));

        const [summary, coursesResponse] = await Promise.all([
          courseService.getAdminSummary(),
          courseService.getAdminCourses(50, 0),
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
    };

    void loadAdminCourses();
  }, [t]);

  const localizedCourses = useMemo(
    () => state.courses.map((course) => toLocalizedCourse(course, i18n.language)),
    [i18n.language, state.courses],
  );

  const formatLevel = (level: Course['level']) => formatAdminCourseLevel(level, t);

  const formatStatus = (status: Course['status']) => formatAdminCourseStatus(status, t);

  const formatUpdatedAt = (updatedAt: string) => formatAdminUpdatedAt(updatedAt, i18n.language);

  const handleStatusChange = async (
    course: Course,
    nextStatus: 'draft' | 'published' | 'archived',
  ) => {
    if (course.status === nextStatus) {
      return;
    }

    try {
      setActingCourseId(course.id);
      setActionError(null);
      setActionMessage(null);

      const updatedCourse = await courseService.updateCourse(course.id, {
        status: nextStatus,
      });

      setState((previous) => ({
        ...previous,
        summary: updateSummaryForStatusChange(
          previous.summary,
          course.status as 'draft' | 'published' | 'archived',
          nextStatus,
        ),
        courses: previous.courses.map((entry) => (entry.id === course.id ? updatedCourse : entry)),
      }));

      setActionMessage(
        t('courseActions.statusUpdated', {
          defaultValue: 'Course status updated.',
        }),
      );
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          t('courseActions.statusUpdateFailed', {
            defaultValue: 'Failed to update course status.',
          }),
        ),
      );
    } finally {
      setActingCourseId(null);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    const confirmed = window.confirm(
      t('courseActions.deleteConfirm', {
        defaultValue: 'Delete this course permanently? This action cannot be undone.',
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      setActingCourseId(course.id);
      setActionError(null);
      setActionMessage(null);

      await courseService.deleteCourse(course.id);

      setState((previous) => ({
        ...previous,
        summary: updateSummaryForDelete(
          previous.summary,
          course.status as 'draft' | 'published' | 'archived',
        ),
        courses: previous.courses.filter((entry) => entry.id !== course.id),
      }));

      setActionMessage(
        t('courseActions.deleted', {
          defaultValue: 'Course deleted successfully.',
        }),
      );
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          t('courseActions.deleteFailed', {
            defaultValue: 'Failed to delete course.',
          }),
        ),
      );
    } finally {
      setActingCourseId(null);
    }
  };

  return {
    actionError,
    actionMessage,
    actingCourseId,
    error: state.error,
    formatLevel,
    formatStatus,
    formatUpdatedAt,
    handleDeleteCourse,
    handleStatusChange,
    loading: state.loading,
    localizedCourses,
    summary: state.summary,
    t,
  };
}
