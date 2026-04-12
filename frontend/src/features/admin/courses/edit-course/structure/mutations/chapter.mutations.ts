import { Dispatch, SetStateAction } from 'react';
import courseService, { Course, CreateChapterRequest } from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { removeChapter, upsertChapter } from '@/features/admin/courses/edit-course/shared/EditCourseState.utils';
import { ChapterFormState, SubChapterFormState, TranslationFn } from '../types';
import { buildChapterPayload, validateChapterForm } from '../lib/structure.helpers';

type SetState<T> = Dispatch<SetStateAction<T>>;

type ChapterMutationParams = {
  chapterForm: ChapterFormState;
  course: Course | null;
  courseId?: string;
  editingChapterId: string | null;
  resetChapterForm: () => void;
  resetSubChapterForm: (chapterId?: string) => void;
  setChapterError: SetState<string | null>;
  setChapterMessage: SetState<string | null>;
  setCourse: SetState<Course | null>;
  setDeletingChapterId: SetState<string | null>;
  setIsSubmittingChapter: SetState<boolean>;
  setSubChapterForm: SetState<SubChapterFormState>;
  subChapterForm: SubChapterFormState;
  t: TranslationFn;
};

export async function submitChapterMutation({
  chapterForm,
  course,
  courseId,
  editingChapterId,
  resetChapterForm,
  setChapterError,
  setChapterMessage,
  setCourse,
  setIsSubmittingChapter,
  setSubChapterForm,
  t,
}: Omit<ChapterMutationParams, 'resetSubChapterForm' | 'setDeletingChapterId' | 'subChapterForm'>) {
  setChapterMessage(null);
  setChapterError(null);

  if (!course || !courseId) {
    setChapterError(
      t('edit.chapters.missingCourseId', {
        defaultValue: 'Missing course id.',
      }),
    );
    return;
  }

  const validationError = validateChapterForm(chapterForm, t);
  if (validationError) {
    setChapterError(validationError);
    return;
  }

  const payload: CreateChapterRequest = buildChapterPayload(chapterForm);

  try {
    setIsSubmittingChapter(true);

    const chapter = editingChapterId
      ? await courseService.updateChapter(courseId, editingChapterId, payload)
      : await courseService.createChapter(courseId, payload);

    setCourse((current) => (current ? upsertChapter(current, chapter) : current));
    setChapterMessage(
      editingChapterId
        ? t('edit.chapters.updated', { defaultValue: 'Chapter updated successfully.' })
        : t('edit.chapters.created', { defaultValue: 'Chapter created successfully.' }),
    );
    resetChapterForm();

    setSubChapterForm((previous) =>
      previous.chapterId
        ? previous
        : {
            ...previous,
            chapterId: chapter.id,
          },
    );
  } catch (error) {
    setChapterError(
      getApiErrorMessage(
        error,
        editingChapterId
          ? t('edit.chapters.updateFailed', {
              defaultValue: 'Failed to update chapter.',
            })
          : t('edit.chapters.createFailed', {
              defaultValue: 'Failed to create chapter.',
            }),
      ),
    );
  } finally {
    setIsSubmittingChapter(false);
  }
}

export async function deleteChapterMutation(
  chapterId: string,
  {
    courseId,
    editingChapterId,
    resetChapterForm,
    resetSubChapterForm,
    setChapterError,
    setChapterMessage,
    setCourse,
    setDeletingChapterId,
    subChapterForm,
    t,
  }: Pick<
    ChapterMutationParams,
    | 'courseId'
    | 'editingChapterId'
    | 'resetChapterForm'
    | 'resetSubChapterForm'
    | 'setChapterError'
    | 'setChapterMessage'
    | 'setCourse'
    | 'setDeletingChapterId'
    | 'subChapterForm'
    | 't'
  >,
) {
  if (!courseId) {
    return;
  }

  const confirmed = window.confirm(
    t('edit.chapters.deleteConfirm', {
      defaultValue: 'Delete this chapter? This action cannot be undone.',
    }),
  );

  if (!confirmed) {
    return;
  }

  setChapterMessage(null);
  setChapterError(null);

  try {
    setDeletingChapterId(chapterId);
    await courseService.deleteChapter(courseId, chapterId);
    setCourse((current) => (current ? removeChapter(current, chapterId) : current));
    setChapterMessage(
      t('edit.chapters.deleted', {
        defaultValue: 'Chapter deleted successfully.',
      }),
    );

    if (editingChapterId === chapterId) {
      resetChapterForm();
    }

    if (subChapterForm.chapterId === chapterId) {
      resetSubChapterForm();
    }
  } catch (error) {
    setChapterError(
      getApiErrorMessage(
        error,
        t('edit.chapters.deleteFailed', {
          defaultValue: 'Failed to delete chapter.',
        }),
      ),
    );
  } finally {
    setDeletingChapterId(null);
  }
}

