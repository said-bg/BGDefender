'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import courseService, {
  type AdminCourseFinalTest,
  type Course,
  type UpsertCourseFinalTestRequest,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { useEditCourseId } from '@/features/admin/courses/edit-course/shared/EditCourseShared';
import useAssessmentDraftForm from '@/features/admin/courses/edit-course/assessments/hooks/useAssessmentDraftForm';
import {
  createEmptyAssessmentForm,
  mapAssessmentToForm,
} from '@/features/admin/courses/edit-course/assessments/lib/assessmentDraft.utils';

export default function useFinalTestPage(language: string, t: TFunction<'admin', undefined>) {
  const courseId = useEditCourseId();
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [finalTestLoading, setFinalTestLoading] = useState(false);
  const [finalTestError, setFinalTestError] = useState<string | null>(null);
  const [finalTestMessage, setFinalTestMessage] = useState<string | null>(null);
  const [loadedFinalTest, setLoadedFinalTest] = useState<AdminCourseFinalTest | null>(null);
  const [isSavingFinalTest, setIsSavingFinalTest] = useState(false);
  const [isDeletingFinalTest, setIsDeletingFinalTest] = useState(false);
  const assessment = useAssessmentDraftForm(createEmptyAssessmentForm());
  const {
    form,
    replaceForm,
    addOption,
    addQuestion,
    handleQuestionTypeChange,
    removeOption,
    removeQuestion,
    toggleOptionCorrect,
    updateOptionField,
    updateQuestionField,
    updateTopLevelField,
  } = assessment;

  useEffect(() => {
    if (!courseId) {
      setLoadError(
        t('edit.missingCourseId', {
          defaultValue: 'Missing course id.',
        }),
      );
      setLoadingPage(false);
      return;
    }

    const loadCourse = async () => {
      try {
        setLoadingPage(true);
        setLoadError(null);
        const response = await courseService.getCourseById(courseId);
        setCourse(response);
      } catch (error) {
        setLoadError(
          getApiErrorMessage(
            error,
            t('edit.failedToLoad', {
              defaultValue: 'Failed to load course data.',
            }),
          ),
        );
      } finally {
        setLoadingPage(false);
      }
    };

    void loadCourse();
  }, [courseId, t]);

  useEffect(() => {
    if (!courseId || !course) {
      return;
    }

    const loadFinalTest = async () => {
      try {
        setFinalTestLoading(true);
        setFinalTestError(null);
        setFinalTestMessage(null);
        const response = await courseService.getCourseFinalTest(courseId);
        const adminFinalTest = response && 'stats' in response ? response : null;
        setLoadedFinalTest(adminFinalTest);
        replaceForm(
          adminFinalTest
            ? mapAssessmentToForm(adminFinalTest)
            : createEmptyAssessmentForm(
                `${course.titleEn} final test`,
                `${course.titleFi} final test`,
              ),
        );
      } catch (error) {
        setFinalTestError(
          getApiErrorMessage(
            error,
            t('edit.finalTest.failedToLoad', {
              defaultValue: 'Failed to load the final test.',
            }),
          ),
        );
      } finally {
        setFinalTestLoading(false);
      }
    };

    void loadFinalTest();
  }, [course, courseId, replaceForm, t]);

  const localizedCourseTitle = useMemo(() => {
    if (!course) {
      return '';
    }

    return language === 'fi' ? course.titleFi : course.titleEn;
  }, [course, language]);

  const resetCurrentForm = useCallback(() => {
    setFinalTestError(null);
    setFinalTestMessage(null);
    replaceForm(
      loadedFinalTest
        ? mapAssessmentToForm(loadedFinalTest)
        : createEmptyAssessmentForm(
            course ? `${course.titleEn} final test` : '',
            course ? `${course.titleFi} final test` : '',
          ),
    );
  }, [course, loadedFinalTest, replaceForm]);

  const handleSaveFinalTest = useCallback(async () => {
    if (!courseId) {
      return;
    }

    try {
      setIsSavingFinalTest(true);
      setFinalTestError(null);
      setFinalTestMessage(null);

      const payload: UpsertCourseFinalTestRequest = {
        titleEn: form.titleEn.trim(),
        titleFi: form.titleFi.trim(),
        descriptionEn: form.descriptionEn.trim() || null,
        descriptionFi: form.descriptionFi.trim() || null,
        passingScore: Number(form.passingScore),
        isPublished: form.isPublished,
        questions: form.questions.map((question, questionIndex) => ({
          promptEn: question.promptEn.trim(),
          promptFi: question.promptFi.trim(),
          explanationEn: question.explanationEn.trim() || null,
          explanationFi: question.explanationFi.trim() || null,
          type: question.type,
          orderIndex: questionIndex + 1,
          options: question.options.map((option, optionIndex) => ({
            labelEn: option.labelEn.trim(),
            labelFi: option.labelFi.trim(),
            isCorrect: option.isCorrect,
            orderIndex: optionIndex + 1,
          })),
        })),
      };

      const savedFinalTest = await courseService.upsertCourseFinalTest(courseId, payload);
      setLoadedFinalTest(savedFinalTest);
      replaceForm(mapAssessmentToForm(savedFinalTest));
      setFinalTestMessage(
        t('edit.finalTest.saved', {
          defaultValue: 'Final test saved successfully.',
        }),
      );
    } catch (error) {
      setFinalTestError(
        getApiErrorMessage(
          error,
          t('edit.finalTest.saveFailed', {
            defaultValue: 'Failed to save the final test.',
          }),
        ),
      );
    } finally {
      setIsSavingFinalTest(false);
    }
  }, [courseId, form, replaceForm, t]);

  const handleDeleteFinalTest = useCallback(async () => {
    if (!courseId || !loadedFinalTest) {
      return;
    }

    const confirmed = window.confirm(
      t('edit.finalTest.deleteConfirm', {
        defaultValue: 'Delete this final test? This action cannot be undone.',
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingFinalTest(true);
      setFinalTestError(null);
      setFinalTestMessage(null);
      await courseService.deleteCourseFinalTest(courseId);
      setLoadedFinalTest(null);
      replaceForm(
        createEmptyAssessmentForm(
          course ? `${course.titleEn} final test` : '',
          course ? `${course.titleFi} final test` : '',
        ),
      );
      setFinalTestMessage(
        t('edit.finalTest.deleted', {
          defaultValue: 'Final test deleted successfully.',
        }),
      );
    } catch (error) {
      setFinalTestError(
        getApiErrorMessage(
          error,
          t('edit.finalTest.deleteFailed', {
            defaultValue: 'Failed to delete the final test.',
          }),
        ),
      );
    } finally {
      setIsDeletingFinalTest(false);
    }
  }, [course, courseId, loadedFinalTest, replaceForm, t]);

  return {
    course,
    courseId,
    finalTestError,
    finalTestLoading,
    finalTestMessage,
    handleDeleteFinalTest,
    handleSaveFinalTest,
    isDeletingFinalTest,
    isSavingFinalTest,
    loadError,
    loadedFinalTest,
    loadingPage,
    localizedCourseTitle,
    resetCurrentForm,
    setFinalTestError,
    setFinalTestMessage,
    addOption,
    addQuestion,
    form,
    handleQuestionTypeChange,
    removeOption,
    removeQuestion,
    toggleOptionCorrect,
    updateOptionField,
    updateQuestionField,
    updateTopLevelField,
  };
}
