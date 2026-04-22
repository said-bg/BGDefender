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

export const validateChapterForm = (
  chapterForm: ChapterFormState,
  t: TranslationFn,
): string | null => {
  if (!chapterForm.titleEn.trim() || !chapterForm.titleFi.trim()) {
    return t('edit.chapters.titleRequired', {
      defaultValue: 'Both English and Finnish chapter titles are required.',
    });
  }

  if (!chapterForm.descriptionEn.trim() || !chapterForm.descriptionFi.trim()) {
    return t('edit.chapters.descriptionRequired', {
      defaultValue: 'Both English and Finnish chapter descriptions are required.',
    });
  }

  const orderIndex = Number(chapterForm.orderIndex);
  if (!Number.isFinite(orderIndex) || orderIndex <= 0) {
    return t('edit.chapters.orderInvalid', {
      defaultValue: 'Chapter order must be a number greater than zero.',
    });
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
    return t('edit.subchapters.parentRequired', {
      defaultValue: 'Choose a chapter before creating a subchapter.',
    });
  }

  if (!subChapterForm.titleEn.trim() || !subChapterForm.titleFi.trim()) {
    return t('edit.subchapters.titleRequired', {
      defaultValue: 'Both English and Finnish subchapter titles are required.',
    });
  }

  if (!subChapterForm.descriptionEn.trim() || !subChapterForm.descriptionFi.trim()) {
    return t('edit.subchapters.descriptionRequired', {
      defaultValue: 'Both English and Finnish subchapter descriptions are required.',
    });
  }

  const orderIndex = Number(subChapterForm.orderIndex);
  if (!Number.isFinite(orderIndex) || orderIndex <= 0) {
    return t('edit.subchapters.orderInvalid', {
      defaultValue: 'Subchapter order must be a number greater than zero.',
    });
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
  orderIndex: String((chapter?.subChapters?.length ?? 0) + 1 || 1),
});
