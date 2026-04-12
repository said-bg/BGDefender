'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import courseService, {
  type AdminChapterQuiz,
  type Course,
  type UpsertChapterQuizRequest,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { useEditCourseId } from '@/features/admin/courses/edit-course/shared/EditCourseShared';
import useAssessmentDraftForm from '@/features/admin/courses/edit-course/assessments/hooks/useAssessmentDraftForm';
import {
  createEmptyAssessmentForm,
  mapAssessmentToForm,
} from '@/features/admin/courses/edit-course/assessments/lib/assessmentDraft.utils';

const sortChapters = (course: Course): Course => ({
  ...course,
  chapters: [...course.chapters].sort((left, right) => left.orderIndex - right.orderIndex),
});

export default function useQuizPage(language: string, t: TFunction<'admin', undefined>) {
  const courseId = useEditCourseId();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizMessage, setQuizMessage] = useState<string | null>(null);
  const [loadedQuiz, setLoadedQuiz] = useState<AdminChapterQuiz | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
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
        t('edit.chapters.missingCourseId', {
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
        const normalizedCourse = sortChapters(response);
        setCourse(normalizedCourse);
        setSelectedChapterId((previous) => previous ?? normalizedCourse.chapters[0]?.id ?? null);
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

  const chapters = useMemo(
    () =>
      course ? [...course.chapters].sort((left, right) => left.orderIndex - right.orderIndex) : [],
    [course],
  );

  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? null;

  const localizedCourseTitle = useMemo(() => {
    if (!course) {
      return '';
    }

    return language === 'fi' ? course.titleFi : course.titleEn;
  }, [course, language]);

  const syncChapterQuizSummary = useCallback((chapterId: string, quiz: AdminChapterQuiz | null) => {
    setCourse((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        chapters: previous.chapters.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                trainingQuiz: quiz
                  ? {
                      id: quiz.id,
                      titleEn: quiz.titleEn,
                      titleFi: quiz.titleFi,
                      descriptionEn: quiz.descriptionEn,
                      descriptionFi: quiz.descriptionFi,
                      passingScore: quiz.passingScore,
                      isPublished: quiz.isPublished,
                    }
                  : null,
              }
            : chapter,
        ),
      };
    });
  }, []);

  useEffect(() => {
    if (!courseId || !selectedChapterId || !selectedChapter) {
      return;
    }

    const loadQuiz = async () => {
      try {
        setQuizLoading(true);
        setQuizError(null);
        setQuizMessage(null);
        const response = await courseService.getChapterQuiz(courseId, selectedChapterId);
        const adminQuiz = response && 'stats' in response ? response : null;
        setLoadedQuiz(adminQuiz);
        replaceForm(
          adminQuiz
            ? mapAssessmentToForm(adminQuiz)
            : createEmptyAssessmentForm(
                `${selectedChapter.titleEn} training quiz`,
                `${selectedChapter.titleFi} training quiz`,
              ),
        );
      } catch (error) {
        setQuizError(
          getApiErrorMessage(
            error,
            t('edit.quiz.failedToLoad', {
              defaultValue: 'Failed to load chapter quiz.',
            }),
          ),
        );
      } finally {
        setQuizLoading(false);
      }
    };

    void loadQuiz();
  }, [courseId, replaceForm, selectedChapter, selectedChapterId, t]);

  const resetCurrentForm = useCallback(() => {
    setQuizError(null);
    setQuizMessage(null);
    replaceForm(
      loadedQuiz
        ? mapAssessmentToForm(loadedQuiz)
        : createEmptyAssessmentForm(
            selectedChapter ? `${selectedChapter.titleEn} training quiz` : '',
            selectedChapter ? `${selectedChapter.titleFi} training quiz` : '',
          ),
    );
  }, [loadedQuiz, replaceForm, selectedChapter]);

  const handleSaveQuiz = useCallback(async () => {
    if (!courseId || !selectedChapterId) {
      return;
    }

    try {
      setIsSavingQuiz(true);
      setQuizError(null);
      setQuizMessage(null);

      const payload: UpsertChapterQuizRequest = {
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

      const savedQuiz = await courseService.upsertChapterQuiz(courseId, selectedChapterId, payload);
      setLoadedQuiz(savedQuiz);
      replaceForm(mapAssessmentToForm(savedQuiz));
      syncChapterQuizSummary(selectedChapterId, savedQuiz);
      setQuizMessage(
        t('edit.quiz.saved', {
          defaultValue: 'Training quiz saved successfully.',
        }),
      );
    } catch (error) {
      setQuizError(
        getApiErrorMessage(
          error,
          t('edit.quiz.saveFailed', {
            defaultValue: 'Failed to save training quiz.',
          }),
        ),
      );
    } finally {
      setIsSavingQuiz(false);
    }
  }, [courseId, form, replaceForm, selectedChapterId, syncChapterQuizSummary, t]);

  const handleDeleteQuiz = useCallback(async () => {
    if (!courseId || !selectedChapterId || !loadedQuiz) {
      return;
    }

    const confirmed = window.confirm(
      t('edit.quiz.deleteConfirm', {
        defaultValue: 'Delete this training quiz? This action cannot be undone.',
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingQuiz(true);
      setQuizError(null);
      setQuizMessage(null);
      await courseService.deleteChapterQuiz(courseId, selectedChapterId);
      setLoadedQuiz(null);
      replaceForm(
        createEmptyAssessmentForm(
          selectedChapter ? `${selectedChapter.titleEn} training quiz` : '',
          selectedChapter ? `${selectedChapter.titleFi} training quiz` : '',
        ),
      );
      syncChapterQuizSummary(selectedChapterId, null);
      setQuizMessage(
        t('edit.quiz.deleted', {
          defaultValue: 'Training quiz deleted successfully.',
        }),
      );
    } catch (error) {
      setQuizError(
        getApiErrorMessage(
          error,
          t('edit.quiz.deleteFailed', {
            defaultValue: 'Failed to delete training quiz.',
          }),
        ),
      );
    } finally {
      setIsDeletingQuiz(false);
    }
  }, [courseId, loadedQuiz, replaceForm, selectedChapter, selectedChapterId, syncChapterQuizSummary, t]);

  return {
    chapters,
    course,
    courseId,
    isDeletingQuiz,
    isSavingQuiz,
    loadError,
    loadedQuiz,
    loadingPage,
    localizedCourseTitle,
    quizError,
    quizLoading,
    quizMessage,
    resetCurrentForm,
    selectedChapter,
    selectedChapterId,
    setQuizError,
    setQuizMessage,
    setSelectedChapterId,
    handleDeleteQuiz,
    handleSaveQuiz,
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
