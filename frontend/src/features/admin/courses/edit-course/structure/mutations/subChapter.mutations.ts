import { Dispatch, SetStateAction } from 'react';
import courseService, { Course, CreateSubChapterRequest } from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { removeSubChapter, upsertSubChapter } from '@/features/admin/courses/edit-course/shared/EditCourseState.utils';
import { SubChapterFormState, TranslationFn } from '../types';
import { buildSubChapterPayload, validateSubChapterForm } from '../lib/structure.helpers';

type SetState<T> = Dispatch<SetStateAction<T>>;

type SubChapterMutationParams = {
  course: Course | null;
  courseId?: string;
  editingSubChapterId: string | null;
  resetSubChapterForm: (chapterId?: string) => void;
  setCourse: SetState<Course | null>;
  setDeletingSubChapterId: SetState<string | null>;
  setIsSubmittingSubChapter: SetState<boolean>;
  setSubChapterError: SetState<string | null>;
  setSubChapterMessage: SetState<string | null>;
  subChapterForm: SubChapterFormState;
  t: TranslationFn;
};

export async function submitSubChapterMutation({
  course,
  courseId,
  editingSubChapterId,
  resetSubChapterForm,
  setCourse,
  setIsSubmittingSubChapter,
  setSubChapterError,
  setSubChapterMessage,
  subChapterForm,
  t,
}: Omit<SubChapterMutationParams, 'setDeletingSubChapterId'>) {
  setSubChapterMessage(null);
  setSubChapterError(null);

  if (!course || !courseId) {
    setSubChapterError(
      t('edit.subchapters.missingCourseId', {
        defaultValue: 'Missing course id.',
      }),
    );
    return;
  }

  const validationError = validateSubChapterForm(subChapterForm, t);
  if (validationError) {
    setSubChapterError(validationError);
    return;
  }

  const payload: CreateSubChapterRequest = buildSubChapterPayload(subChapterForm);

  try {
    setIsSubmittingSubChapter(true);

    const subChapter = editingSubChapterId
      ? await courseService.updateSubChapter(
          courseId,
          subChapterForm.chapterId,
          editingSubChapterId,
          payload,
        )
      : await courseService.createSubChapter(courseId, subChapterForm.chapterId, payload);

    setCourse((current) =>
      current ? upsertSubChapter(current, subChapterForm.chapterId, subChapter) : current,
    );
    setSubChapterMessage(
      editingSubChapterId
        ? t('edit.subchapters.updated', {
            defaultValue: 'Subchapter updated successfully.',
          })
        : t('edit.subchapters.created', {
            defaultValue: 'Subchapter created successfully.',
          }),
    );
    resetSubChapterForm(subChapterForm.chapterId);
  } catch (error) {
    setSubChapterError(
      getApiErrorMessage(
        error,
        editingSubChapterId
          ? t('edit.subchapters.updateFailed', {
              defaultValue: 'Failed to update subchapter.',
            })
          : t('edit.subchapters.createFailed', {
              defaultValue: 'Failed to create subchapter.',
            }),
      ),
    );
  } finally {
    setIsSubmittingSubChapter(false);
  }
}

export async function deleteSubChapterMutation(
  chapterId: string,
  subChapterId: string,
  {
    courseId,
    editingSubChapterId,
    resetSubChapterForm,
    setCourse,
    setDeletingSubChapterId,
    setSubChapterError,
    setSubChapterMessage,
    t,
  }: Pick<
    SubChapterMutationParams,
    | 'courseId'
    | 'editingSubChapterId'
    | 'resetSubChapterForm'
    | 'setCourse'
    | 'setDeletingSubChapterId'
    | 'setSubChapterError'
    | 'setSubChapterMessage'
    | 't'
  >,
) {
  if (!courseId) {
    return;
  }

  const confirmed = window.confirm(
    t('edit.subchapters.deleteConfirm', {
      defaultValue: 'Delete this subchapter? This action cannot be undone.',
    }),
  );

  if (!confirmed) {
    return;
  }

  setSubChapterMessage(null);
  setSubChapterError(null);

  try {
    setDeletingSubChapterId(subChapterId);
    await courseService.deleteSubChapter(courseId, chapterId, subChapterId);
    setCourse((current) =>
      current ? removeSubChapter(current, chapterId, subChapterId) : current,
    );
    setSubChapterMessage(
      t('edit.subchapters.deleted', {
        defaultValue: 'Subchapter deleted successfully.',
      }),
    );

    if (editingSubChapterId === subChapterId) {
      resetSubChapterForm(chapterId);
    }
  } catch (error) {
    setSubChapterError(
      getApiErrorMessage(
        error,
        t('edit.subchapters.deleteFailed', {
          defaultValue: 'Failed to delete subchapter.',
        }),
      ),
    );
  } finally {
    setDeletingSubChapterId(null);
  }
}

