import { Dispatch, SetStateAction } from 'react';
import courseService, {
  Chapter,
  Course,
  CreatePedagogicalContentRequest,
  SubChapter,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  removePedagogicalContent,
  upsertPedagogicalContent,
} from '@/features/admin/courses/edit-course/shared/EditCourseState.utils';
import { ContentBlockFormState, validateContentForm } from '../lib/content.utils';

type SetState<T> = Dispatch<SetStateAction<T>>;
type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type SubmitContentParams = {
  activeChapter: Chapter | null;
  activeSubChapter: SubChapter | null;
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
  activeChapter,
  activeSubChapter,
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
    const saved = editingContentId
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
        );

    setCourse((current) =>
      current
        ? upsertPedagogicalContent(
            current,
            contentForm.chapterId,
            contentForm.subChapterId,
            saved,
          )
        : current,
    );
    setContentMessage(
      editingContentId
        ? t('edit.contentBlocks.updated', {
            defaultValue: 'Content block updated successfully.',
          })
        : t('edit.contentBlocks.created', {
            defaultValue: 'Content block created successfully.',
          }),
    );
    resetContentForm(activeChapter, activeSubChapter);
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
  activeChapter: Chapter | null;
  activeSubChapter: SubChapter | null;
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
  activeChapter,
  activeSubChapter,
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
    setCourse((current) =>
      current ? removePedagogicalContent(current, chapterId, subChapterId, contentId) : current,
    );
    setContentMessage(
      t('edit.contentBlocks.deleted', {
        defaultValue: 'Content block deleted successfully.',
      }),
    );

    if (editingContentId === contentId) {
      resetContentForm(activeChapter, activeSubChapter);
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

