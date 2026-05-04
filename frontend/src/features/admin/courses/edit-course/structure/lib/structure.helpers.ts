import { Chapter, Course, CreateChapterRequest, CreateSubChapterRequest } from '@/services/course';
import { normalizeAndSortByOrderIndex } from '@/features/admin/courses/edit-course/shared/EditCourseState.utils';
import { ChapterFormState, SubChapterFormState, TranslationFn } from '../types';

export const normalizeStructureCourse = (course: Course): Course => ({
  ...course,
  chapters: normalizeAndSortByOrderIndex(course.chapters ?? []).map((chapter) => ({
    ...chapter,
    subChapters: normalizeAndSortByOrderIndex(chapter.subChapters ?? []),
  })),
});

export const getNextSiblingOrderIndex = (items: Array<{ orderIndex: number }> = []) =>
  String(items.length + 1);

export const buildDefaultChapterFormState = (chapters: Chapter[] = []) => ({
  orderIndex: getNextSiblingOrderIndex(chapters),
});

export const validateChapterForm = (
  chapterForm: ChapterFormState,
  t: TranslationFn,
): string | null => {
  if (!chapterForm.titleEn.trim() || !chapterForm.titleFi.trim()) {
    return t('edit.chapters.titleRequired');
  }

  if (!chapterForm.descriptionEn.trim() || !chapterForm.descriptionFi.trim()) {
    return t('edit.chapters.descriptionRequired');
  }

  const orderIndex = Number(chapterForm.orderIndex);
  if (!Number.isFinite(orderIndex) || orderIndex <= 0) {
    return t('edit.chapters.orderInvalid');
  }

  return null;
};

export const buildChapterPayload = (
  chapterForm: ChapterFormState,
): CreateChapterRequest => ({
  titleEn: chapterForm.titleEn.trim(),
  titleFi: chapterForm.titleFi.trim(),
  descriptionEn: chapterForm.descriptionEn.trim(),
  descriptionFi: chapterForm.descriptionFi.trim(),
  orderIndex: Number(chapterForm.orderIndex),
});

export const validateSubChapterForm = (
  subChapterForm: SubChapterFormState,
  t: TranslationFn,
): string | null => {
  if (!subChapterForm.chapterId) {
    return t('edit.subchapters.parentRequired');
  }

  if (!subChapterForm.titleEn.trim() || !subChapterForm.titleFi.trim()) {
    return t('edit.subchapters.titleRequired');
  }

  if (!subChapterForm.descriptionEn.trim() || !subChapterForm.descriptionFi.trim()) {
    return t('edit.subchapters.descriptionRequired');
  }

  const orderIndex = Number(subChapterForm.orderIndex);
  if (!Number.isFinite(orderIndex) || orderIndex <= 0) {
    return t('edit.subchapters.orderInvalid');
  }

  return null;
};

export const buildSubChapterPayload = (
  subChapterForm: SubChapterFormState,
): CreateSubChapterRequest => ({
  titleEn: subChapterForm.titleEn.trim(),
  titleFi: subChapterForm.titleFi.trim(),
  descriptionEn: subChapterForm.descriptionEn.trim(),
  descriptionFi: subChapterForm.descriptionFi.trim(),
  orderIndex: Number(subChapterForm.orderIndex),
});

export const buildDefaultSubChapterFormState = (chapter: Chapter | null) => ({
  chapterId: chapter?.id ?? '',
  orderIndex: getNextSiblingOrderIndex(chapter?.subChapters ?? []),
});
