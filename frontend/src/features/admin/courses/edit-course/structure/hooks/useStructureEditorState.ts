'use client';

import { useMemo, useState } from 'react';
import { Chapter, Course, SubChapter } from '@/services/course';
import {
  ChapterFormState,
  initialChapterForm,
  initialSubChapterForm,
  SubChapterFormState,
} from '../types';
import { buildDefaultSubChapterFormState } from '../lib/structure.helpers';

type UseStructureEditorStateParams = {
  course: Course | null;
  chapters: Chapter[];
};

export function useStructureEditorState({
  course,
  chapters,
}: UseStructureEditorStateParams) {
  const [chapterForm, setChapterForm] = useState<ChapterFormState>(initialChapterForm);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterMessage, setChapterMessage] = useState<string | null>(null);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [isSubmittingChapter, setIsSubmittingChapter] = useState(false);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);

  const [subChapterForm, setSubChapterForm] = useState<SubChapterFormState>(initialSubChapterForm);
  const [editingSubChapterId, setEditingSubChapterId] = useState<string | null>(null);
  const [subChapterMessage, setSubChapterMessage] = useState<string | null>(null);
  const [subChapterError, setSubChapterError] = useState<string | null>(null);
  const [isSubmittingSubChapter, setIsSubmittingSubChapter] = useState(false);
  const [deletingSubChapterId, setDeletingSubChapterId] = useState<string | null>(null);

  const availableParentChapter = useMemo(
    () =>
      chapters.find((chapter) => chapter.id === subChapterForm.chapterId) ??
      chapters[0] ??
      null,
    [chapters, subChapterForm.chapterId],
  );

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
    setChapterForm({
      ...initialChapterForm,
      orderIndex: String((courseSnapshot?.chapters.length ?? 0) + 1),
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
    setSubChapterForm({
      ...initialSubChapterForm,
      ...buildDefaultSubChapterFormState(parentChapter),
    });
  };

  const startEditingChapter = (chapter: Chapter) => {
    clearChapterFeedback();
    setEditingSubChapterId(null);
    setEditingChapterId(chapter.id);
    setChapterForm({
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
    setSubChapterForm({
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

