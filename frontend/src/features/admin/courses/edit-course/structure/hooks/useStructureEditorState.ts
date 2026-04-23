'use client';

import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { Chapter, Course, SubChapter } from '@/services/course';
import {
  ChapterFormState,
  initialChapterForm,
  initialSubChapterForm,
  SubChapterFormState,
} from '../types';
import {
  buildDefaultChapterFormState,
  buildDefaultSubChapterFormState,
} from '../lib/structure.helpers';

type UseStructureEditorStateParams = {
  course: Course | null;
  chapters: Chapter[];
};

const hasChapterDraftContent = (form: ChapterFormState) =>
  Boolean(
    form.titleEn.trim() ||
      form.titleFi.trim() ||
      form.descriptionEn.trim() ||
      form.descriptionFi.trim(),
  );

const hasSubChapterDraftContent = (form: SubChapterFormState) =>
  Boolean(
    form.titleEn.trim() ||
      form.titleFi.trim() ||
      form.descriptionEn.trim() ||
      form.descriptionFi.trim(),
  );

const shouldUseDefaultChapterOrder = (
  form: ChapterFormState,
  editingChapterId: string | null,
) =>
  !editingChapterId &&
  !hasChapterDraftContent(form) &&
  form.orderIndex === initialChapterForm.orderIndex;

const applyDefaultChapterOrder = (
  form: ChapterFormState,
  chapters: Chapter[],
  editingChapterId: string | null,
) =>
  shouldUseDefaultChapterOrder(form, editingChapterId)
    ? { ...form, ...buildDefaultChapterFormState(chapters) }
    : form;

const getDefaultSubChapterState = (
  form: SubChapterFormState,
  chapters: Chapter[],
) => {
  const parentChapter =
    chapters.find((chapter) => chapter.id === form.chapterId) ?? chapters[0] ?? null;

  return parentChapter ? buildDefaultSubChapterFormState(parentChapter) : null;
};

const shouldUseDefaultSubChapterOrder = (
  form: SubChapterFormState,
  editingSubChapterId: string | null,
) =>
  !editingSubChapterId &&
  !hasSubChapterDraftContent(form) &&
  (!form.chapterId || form.orderIndex === initialSubChapterForm.orderIndex);

const applyDefaultSubChapterOrder = (
  form: SubChapterFormState,
  chapters: Chapter[],
  editingSubChapterId: string | null,
) => {
  if (!shouldUseDefaultSubChapterOrder(form, editingSubChapterId)) {
    return form;
  }

  const defaults = getDefaultSubChapterState(form, chapters);
  return defaults ? { ...form, ...defaults } : form;
};

export function useStructureEditorState({
  course,
  chapters,
}: UseStructureEditorStateParams) {
  const [chapterFormState, setChapterFormState] =
    useState<ChapterFormState>(initialChapterForm);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterMessage, setChapterMessage] = useState<string | null>(null);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [isSubmittingChapter, setIsSubmittingChapter] = useState(false);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);

  const [subChapterFormState, setSubChapterFormState] =
    useState<SubChapterFormState>(initialSubChapterForm);
  const [editingSubChapterId, setEditingSubChapterId] = useState<string | null>(null);
  const [subChapterMessage, setSubChapterMessage] = useState<string | null>(null);
  const [subChapterError, setSubChapterError] = useState<string | null>(null);
  const [isSubmittingSubChapter, setIsSubmittingSubChapter] = useState(false);
  const [deletingSubChapterId, setDeletingSubChapterId] = useState<string | null>(null);

  const chapterForm = applyDefaultChapterOrder(
    chapterFormState,
    chapters,
    editingChapterId,
  );
  const subChapterForm = applyDefaultSubChapterOrder(
    subChapterFormState,
    chapters,
    editingSubChapterId,
  );

  const setChapterForm: Dispatch<SetStateAction<ChapterFormState>> = (action) => {
    setChapterFormState((previous) => {
      const effectivePrevious = applyDefaultChapterOrder(
        previous,
        chapters,
        editingChapterId,
      );
      return typeof action === 'function' ? action(effectivePrevious) : action;
    });
  };

  const availableParentChapter = useMemo(
    () =>
      chapters.find((chapter) => chapter.id === subChapterForm.chapterId) ??
      chapters[0] ??
      null,
    [chapters, subChapterForm.chapterId],
  );

  const setSubChapterForm: Dispatch<SetStateAction<SubChapterFormState>> = (action) => {
    setSubChapterFormState((previous) => {
      const effectivePrevious = applyDefaultSubChapterOrder(
        previous,
        chapters,
        editingSubChapterId,
      );
      return typeof action === 'function' ? action(effectivePrevious) : action;
    });
  };

  const clearChapterFeedback = () => {
    setChapterMessage(null);
    setChapterError(null);
  };

  const clearSubChapterFeedback = () => {
    setSubChapterMessage(null);
    setSubChapterError(null);
  };

  const resetChapterForm = (courseSnapshot: Course | null = course) => {
    setEditingChapterId(null);
    setEditingSubChapterId(null);
    setChapterFormState({
      ...initialChapterForm,
      ...buildDefaultChapterFormState(courseSnapshot?.chapters ?? chapters),
    });
  };

  const resetSubChapterForm = (
    chapterId?: string,
    chaptersSnapshot: Chapter[] = chapters,
  ) => {
    const parentChapter =
      chaptersSnapshot.find((chapter) => chapter.id === chapterId) ??
      chaptersSnapshot[0] ??
      null;

    setEditingChapterId(null);
    setEditingSubChapterId(null);
    setSubChapterFormState({
      ...initialSubChapterForm,
      ...buildDefaultSubChapterFormState(parentChapter),
    });
  };

  const startEditingChapter = (chapter: Chapter) => {
    clearChapterFeedback();
    setEditingSubChapterId(null);
    setEditingChapterId(chapter.id);
    setChapterFormState({
      titleEn: chapter.titleEn,
      titleFi: chapter.titleFi,
      descriptionEn: chapter.descriptionEn,
      descriptionFi: chapter.descriptionFi,
      orderIndex: String(chapter.orderIndex),
    });
  };

  const startEditingSubChapter = (chapter: Chapter, subChapter: SubChapter) => {
    clearSubChapterFeedback();
    setEditingChapterId(null);
    setEditingSubChapterId(subChapter.id);
    setSubChapterFormState({
      chapterId: chapter.id,
      titleEn: subChapter.titleEn,
      titleFi: subChapter.titleFi,
      descriptionEn: subChapter.descriptionEn,
      descriptionFi: subChapter.descriptionFi,
      orderIndex: String(subChapter.orderIndex),
    });
  };

  return {
    availableParentChapter,
    chapterError,
    chapterForm,
    chapterMessage,
    clearChapterFeedback,
    clearSubChapterFeedback,
    deletingChapterId,
    deletingSubChapterId,
    editingChapterId,
    editingSubChapterId,
    isSubmittingChapter,
    isSubmittingSubChapter,
    resetChapterForm,
    resetSubChapterForm,
    setChapterError,
    setChapterForm,
    setChapterMessage,
    setDeletingChapterId,
    setDeletingSubChapterId,
    setEditingChapterId,
    setEditingSubChapterId,
    setIsSubmittingChapter,
    setIsSubmittingSubChapter,
    setSubChapterError,
    setSubChapterForm,
    setSubChapterMessage,
    startEditingChapter,
    startEditingSubChapter,
    subChapterError,
    subChapterForm,
    subChapterMessage,
  };
}

