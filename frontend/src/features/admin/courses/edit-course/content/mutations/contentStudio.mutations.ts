import { Dispatch, SetStateAction } from 'react';
import courseService, {
  Chapter,
  Course,
  CreatePedagogicalContentRequest,
  SubChapter,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  ContentBlockFormState,
  normalizeCourseForContentStudio,
  validateContentForm,
} from '../lib/content.utils';

type SetState<T> = Dispatch<SetStateAction<T>>;
type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type SubmitContentParams = {
  contentForm: ContentBlockFormState;
  courseId?: string;
  editingContentId: string | null;
  resetContentForm: (chapter?: Chapter | null, subChapter?: SubChapter | null) => void;
  setContentError: SetState<string | null>;
  setContentMessage: SetState<string | null>;
  setCourse: SetState<Course | null>;
  setIsSubmittingContent: SetState<boolean>;
  t: TranslationFn;
};

export async function submitContentMutation({
  contentForm,
  courseId,
  editingContentId,
  resetContentForm,
  setContentError,
  setContentMessage,
  setCourse,
  setIsSubmittingContent,
  t,
}: SubmitContentParams) {
  setContentMessage(null);
  setContentError(null);

  const validationError = validateContentForm(contentForm, courseId, t);
  if (validationError || !courseId) {
    setContentError(validationError);
    return;
  }

  const payload: CreatePedagogicalContentRequest = {
    titleEn: contentForm.titleEn.trim(),
    titleFi: contentForm.titleFi.trim(),
    type: 'text',
    contentEn: contentForm.contentEn.trim(),
    contentFi: contentForm.contentFi.trim(),
    orderIndex: Number(contentForm.orderIndex),
  };

  try {
    setIsSubmittingContent(true);
    await (
      editingContentId
      ? await courseService.updatePedagogicalContent(
          courseId,
          contentForm.chapterId,
          contentForm.subChapterId,
          editingContentId,
          payload,
        )
      : await courseService.createPedagogicalContent(
          courseId,
          contentForm.chapterId,
          contentForm.subChapterId,
          payload,
        )
    );
    const freshCourse = normalizeCourseForContentStudio(
      await courseService.getCourseById(courseId),
    );
    const freshChapter =
      freshCourse.chapters.find((chapter) => chapter.id === contentForm.chapterId) ?? null;
    const freshSubChapter =
      freshChapter?.subChapters.find(
        (subChapter) => subChapter.id === contentForm.subChapterId,
      ) ?? null;

    setCourse(freshCourse);
    setContentMessage(
      editingContentId
        ? t('edit.contentBlocks.updated', {
            defaultValue: 'Content block updated successfully.',
          })
        : t('edit.contentBlocks.created', {
            defaultValue: 'Content block created successfully.',
          }),
    );
    resetContentForm(freshChapter, freshSubChapter);
  } catch (error) {
    setContentError(
      getApiErrorMessage(
        error,
        editingContentId
          ? t('edit.contentBlocks.updateFailed', {
              defaultValue: 'Failed to update content block.',
            })
          : t('edit.contentBlocks.createFailed', {
              defaultValue: 'Failed to create content block.',
            }),
      ),
    );
  } finally {
    setIsSubmittingContent(false);
  }
}

type DeleteContentParams = {
  chapterId: string;
  contentId: string;
  courseId?: string;
  editingContentId: string | null;
  resetContentForm: (chapter?: Chapter | null, subChapter?: SubChapter | null) => void;
  setContentError: SetState<string | null>;
  setContentMessage: SetState<string | null>;
  setCourse: SetState<Course | null>;
  setDeletingContentId: SetState<string | null>;
  subChapterId: string;
  t: TranslationFn;
};

export async function deleteContentMutation({
  chapterId,
  contentId,
  courseId,
  editingContentId,
  resetContentForm,
  setContentError,
  setContentMessage,
  setCourse,
  setDeletingContentId,
  subChapterId,
  t,
}: DeleteContentParams) {
  if (!courseId) {
    return;
  }

  const confirmed = window.confirm(
    t('edit.contentBlocks.deleteConfirm', {
      defaultValue: 'Delete this content block? This action cannot be undone.',
    }),
  );

  if (!confirmed) {
    return;
  }

  setContentMessage(null);
  setContentError(null);

  try {
    setDeletingContentId(contentId);
    await courseService.deletePedagogicalContent(courseId, chapterId, subChapterId, contentId);
    const freshCourse = normalizeCourseForContentStudio(
      await courseService.getCourseById(courseId),
    );
    const freshChapter =
      freshCourse.chapters.find((chapter) => chapter.id === chapterId) ?? null;
    const freshSubChapter =
      freshChapter?.subChapters.find((subChapter) => subChapter.id === subChapterId) ?? null;

    setCourse(freshCourse);
    setContentMessage(
      t('edit.contentBlocks.deleted', {
        defaultValue: 'Content block deleted successfully.',
      }),
    );

    if (editingContentId === contentId) {
      resetContentForm(freshChapter, freshSubChapter);
    }
  } catch (error) {
    setContentError(
      getApiErrorMessage(
        error,
        t('edit.contentBlocks.deleteFailed', {
          defaultValue: 'Failed to delete content block.',
        }),
      ),
    );
  } finally {
    setDeletingContentId(null);
  }
}

