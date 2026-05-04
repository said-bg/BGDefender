import { Dispatch, SetStateAction } from 'react';
import courseService, { Course, CreateSubChapterRequest } from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { SubChapterFormState, TranslationFn } from '../types';
import {
  buildSubChapterPayload,
  normalizeStructureCourse,
  validateSubChapterForm,
} from '../lib/structure.helpers';

type SetState<T> = Dispatch<SetStateAction<T>>;

type SubChapterMutationParams = {
  course: Course | null;
  courseId?: string;
  editingSubChapterId: string | null;
  resetSubChapterForm: (chapterId?: string, chaptersSnapshot?: Course['chapters']) => void;
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
    setSubChapterError(t('edit.subchapters.missingCourseId'));
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

    await (
      editingSubChapterId
      ? await courseService.updateSubChapter(
          courseId,
          subChapterForm.chapterId,
          editingSubChapterId,
          payload,
        )
      : await courseService.createSubChapter(courseId, subChapterForm.chapterId, payload)
    );
    const freshCourse = normalizeStructureCourse(
      await courseService.getAdminCourseById(courseId),
    );

    setCourse(freshCourse);
    setSubChapterMessage(
      editingSubChapterId
        ? t('edit.subchapters.updated')
        : t('edit.subchapters.created'),
    );
    resetSubChapterForm(subChapterForm.chapterId, freshCourse.chapters);
  } catch (error) {
    setSubChapterError(
      getApiErrorMessage(
        error,
        editingSubChapterId
          ? t('edit.subchapters.updateFailed')
          : t('edit.subchapters.createFailed'),
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
    subChapterForm,
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
    | 'subChapterForm'
    | 't'
  >,
) {
  if (!courseId) {
    return;
  }

  const confirmed = window.confirm(
    t('edit.subchapters.deleteConfirm'),
  );

  if (!confirmed) {
    return;
  }

  setSubChapterMessage(null);
  setSubChapterError(null);

  try {
    setDeletingSubChapterId(subChapterId);
    await courseService.deleteSubChapter(courseId, chapterId, subChapterId);
    const freshCourse = normalizeStructureCourse(
      await courseService.getAdminCourseById(courseId),
    );
    setCourse(freshCourse);
    setSubChapterMessage(t('edit.subchapters.deleted'));

    if (
      editingSubChapterId === subChapterId ||
      (!editingSubChapterId && subChapterForm.chapterId === chapterId)
    ) {
      resetSubChapterForm(chapterId, freshCourse.chapters);
    }
  } catch (error) {
    setSubChapterError(
      getApiErrorMessage(
        error,
        t('edit.subchapters.deleteFailed'),
      ),
    );
  } finally {
    setDeletingSubChapterId(null);
  }
}

