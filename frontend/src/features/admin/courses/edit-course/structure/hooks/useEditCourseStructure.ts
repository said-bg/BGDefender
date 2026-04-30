'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import courseService, { Course } from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { sortByOrderIndex } from '@/features/admin/courses/edit-course/shared/EditCourseState.utils';
import { TranslationFn } from '../types';
import { normalizeStructureCourse } from '../lib/structure.helpers';
import { deleteChapterMutation, submitChapterMutation } from '../mutations/chapter.mutations';
import { deleteSubChapterMutation, submitSubChapterMutation } from '../mutations/subChapter.mutations';
import { useStructureEditorState } from './useStructureEditorState';

type UseEditCourseStructureParams = {
  courseId?: string;
  language: string;
  t: TranslationFn;
};

export function useEditCourseStructure({
  courseId,
  language,
  t,
}: UseEditCourseStructureParams) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadCourse = useCallback(async () => {
    if (!courseId) {
      return null;
    }

    const response = await courseService.getAdminCourseById(courseId);
    const normalizedCourse = normalizeStructureCourse(response);
    setCourse(normalizedCourse);
    return normalizedCourse;
  }, [courseId]);

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
        await reloadCourse();
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
  }, [courseId, reloadCourse, t]);

  const chapters = useMemo(
    () => (course ? sortByOrderIndex(course.chapters) : []),
    [course],
  );

  const localizedCourseTitle = useMemo(() => {
    if (!course) {
      return '';
    }

    return language === 'fi' ? course.titleFi : course.titleEn;
  }, [course, language]);

  const editor = useStructureEditorState({ course, chapters });

  const handleChapterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitChapterMutation({
      chapterForm: editor.chapterForm,
      course,
      courseId,
      editingChapterId: editor.editingChapterId,
      resetChapterForm: editor.resetChapterForm,
      setChapterError: editor.setChapterError,
      setChapterMessage: editor.setChapterMessage,
      setCourse,
      setIsSubmittingChapter: editor.setIsSubmittingChapter,
      setSubChapterForm: editor.setSubChapterForm,
      t,
    });
  };

  const handleDeleteChapter = async (chapterId: string) => {
    await deleteChapterMutation(chapterId, {
      courseId,
      editingChapterId: editor.editingChapterId,
      resetChapterForm: editor.resetChapterForm,
      resetSubChapterForm: editor.resetSubChapterForm,
      setChapterError: editor.setChapterError,
      setChapterMessage: editor.setChapterMessage,
      setCourse,
      setDeletingChapterId: editor.setDeletingChapterId,
      subChapterForm: editor.subChapterForm,
      t,
    });
  };

  const handleSubChapterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitSubChapterMutation({
      course,
      courseId,
      editingSubChapterId: editor.editingSubChapterId,
      resetSubChapterForm: editor.resetSubChapterForm,
      setCourse,
      setIsSubmittingSubChapter: editor.setIsSubmittingSubChapter,
      setSubChapterError: editor.setSubChapterError,
      setSubChapterMessage: editor.setSubChapterMessage,
      subChapterForm: editor.subChapterForm,
      t,
    });
  };

  const handleDeleteSubChapter = async (chapterId: string, subChapterId: string) => {
    await deleteSubChapterMutation(chapterId, subChapterId, {
      courseId,
      editingSubChapterId: editor.editingSubChapterId,
      resetSubChapterForm: editor.resetSubChapterForm,
      setCourse,
      setDeletingSubChapterId: editor.setDeletingSubChapterId,
      setSubChapterError: editor.setSubChapterError,
      setSubChapterMessage: editor.setSubChapterMessage,
      subChapterForm: editor.subChapterForm,
      t,
    });
  };

  const moveChapter = async (chapterId: string, direction: 'up' | 'down') => {
    if (!courseId) {
      return;
    }

    const chapter = chapters.find((current) => current.id === chapterId);
    if (!chapter) {
      return;
    }

    const nextOrderIndex =
      direction === 'up' ? chapter.orderIndex - 1 : chapter.orderIndex + 1;
    if (nextOrderIndex < 1 || nextOrderIndex > chapters.length) {
      return;
    }

    await courseService.updateChapter(courseId, chapter.id, {
      orderIndex: nextOrderIndex,
    });

    const freshCourse = await reloadCourse();
    if (!freshCourse || editor.editingChapterId !== chapter.id) {
      return;
    }

    const freshChapter =
      freshCourse.chapters.find((current) => current.id === chapter.id) ?? null;
    if (freshChapter) {
      editor.startEditingChapter(freshChapter);
    }
  };

  const moveSubChapter = async (
    chapterId: string,
    subChapterId: string,
    direction: 'up' | 'down',
  ) => {
    if (!courseId) {
      return;
    }

    const chapter = chapters.find((current) => current.id === chapterId);
    const subChapter = chapter?.subChapters.find((current) => current.id === subChapterId);

    if (!chapter || !subChapter) {
      return;
    }

    const nextOrderIndex =
      direction === 'up' ? subChapter.orderIndex - 1 : subChapter.orderIndex + 1;
    if (nextOrderIndex < 1 || nextOrderIndex > chapter.subChapters.length) {
      return;
    }

    await courseService.updateSubChapter(courseId, chapter.id, subChapter.id, {
      orderIndex: nextOrderIndex,
    });

    const freshCourse = await reloadCourse();
    if (!freshCourse || editor.editingSubChapterId !== subChapter.id) {
      return;
    }

    const freshChapter =
      freshCourse.chapters.find((current) => current.id === chapter.id) ?? null;
    const freshSubChapter =
      freshChapter?.subChapters.find((current) => current.id === subChapter.id) ?? null;

    if (freshChapter && freshSubChapter) {
      editor.startEditingSubChapter(freshChapter, freshSubChapter);
    }
  };

  return {
    availableParentChapter: editor.availableParentChapter,
    chapterError: editor.chapterError,
    chapterForm: editor.chapterForm,
    chapterMessage: editor.chapterMessage,
    chapters,
    course,
    courseId,
    deletingChapterId: editor.deletingChapterId,
    deletingSubChapterId: editor.deletingSubChapterId,
    editingChapterId: editor.editingChapterId,
    editingSubChapterId: editor.editingSubChapterId,
    handleChapterSubmit,
    handleDeleteChapter,
    handleDeleteSubChapter,
    handleSubChapterSubmit,
    isSubmittingChapter: editor.isSubmittingChapter,
    isSubmittingSubChapter: editor.isSubmittingSubChapter,
    loadError,
    loadingPage,
    localizedCourseTitle,
    moveChapter,
    moveSubChapter,
    resetChapterForm: editor.resetChapterForm,
    resetSubChapterForm: editor.resetSubChapterForm,
    setChapterForm: editor.setChapterForm,
    setSubChapterForm: editor.setSubChapterForm,
    startEditingChapter: editor.startEditingChapter,
    startEditingSubChapter: editor.startEditingSubChapter,
    subChapterError: editor.subChapterError,
    subChapterForm: editor.subChapterForm,
    subChapterMessage: editor.subChapterMessage,
  };
}

