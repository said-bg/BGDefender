'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
        setCourse(normalizeStructureCourse(response));
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
      t,
    });
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

