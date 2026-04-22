import { Chapter, Course, SubChapter } from '@/services/course';
import { normalizeAndSortByOrderIndex } from '@/features/admin/courses/edit-course/shared/EditCourseState.utils';

export type ContentBlockFormState = {
  chapterId: string;
  subChapterId: string;
  titleEn: string;
  titleFi: string;
  contentEn: string;
  contentFi: string;
  orderIndex: string;
};

export const initialContentBlockForm: ContentBlockFormState = {
  chapterId: '',
  subChapterId: '',
  titleEn: '',
  titleFi: '',
  contentEn: '',
  contentFi: '',
  orderIndex: '1',
};

export const normalizeCourseForContentStudio = (course: Course): Course => ({
  ...course,
  chapters: normalizeAndSortByOrderIndex(course.chapters ?? []).map((chapter) => ({
    ...chapter,
    subChapters: normalizeAndSortByOrderIndex(chapter.subChapters ?? []).map((subChapter) => ({
      ...subChapter,
      pedagogicalContents: normalizeAndSortByOrderIndex(
        subChapter.pedagogicalContents ?? [],
      ),
    })),
  })),
});

export const buildFreshContentForm = (
  chapter: Chapter | null,
  subChapter: SubChapter | null,
): ContentBlockFormState => ({
  ...initialContentBlockForm,
  chapterId: chapter?.id ?? '',
  subChapterId: subChapter?.id ?? '',
  orderIndex: String((subChapter?.pedagogicalContents?.length ?? 0) + 1 || 1),
});

export const validateContentForm = (
  form: ContentBlockFormState,
  courseId: string | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  if (!courseId) {
    return t('edit.contentBlocks.missingCourseId', {
      defaultValue: 'Missing course id.',
    });
  }

  if (!form.subChapterId || !form.chapterId) {
    return t('edit.contentBlocks.parentRequired', {
      defaultValue: 'Choose a subchapter before creating a content block.',
    });
  }

  if (!form.titleEn.trim() || !form.titleFi.trim()) {
    return t('edit.contentBlocks.titleRequired', {
      defaultValue: 'Both English and Finnish block titles are required.',
    });
  }

  if (!form.contentEn.trim() || !form.contentFi.trim()) {
    return t('edit.contentBlocks.contentRequired', {
      defaultValue: 'Both English and Finnish block contents are required.',
    });
  }

  const orderIndex = Number(form.orderIndex);
  if (!Number.isFinite(orderIndex) || orderIndex <= 0) {
    return t('edit.contentBlocks.orderInvalid', {
      defaultValue: 'Block order must be a number greater than zero.',
    });
  }

  return null;
};

