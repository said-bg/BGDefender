import { Dispatch, SetStateAction } from 'react';
import courseService, { Course, CreateChapterRequest } from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { ChapterFormState, SubChapterFormState, TranslationFn } from '../types';
import {
  buildChapterPayload,
  normalizeStructureCourse,
  validateChapterForm,
} from '../lib/structure.helpers';

type SetState<T> = Dispatch<SetStateAction<T>>;

type ChapterMutationParams = {
  chapterForm: ChapterFormState;
  course: Course | null;
  courseId?: string;
  editingChapterId: string | null;
  resetChapterForm: (courseSnapshot?: Course | null) => void;
  resetSubChapterForm: (chapterId?: string, chaptersSnapshot?: Course['chapters']) => void;
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
    setChapterError(t('edit.chapters.missingCourseId'));
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
    const freshCourse = normalizeStructureCourse(
      await courseService.getAdminCourseById(courseId),
    );

    setCourse(freshCourse);
    setChapterMessage(
      editingChapterId ? t('edit.chapters.updated') : t('edit.chapters.created'),
    );
    resetChapterForm(freshCourse);

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
          ? t('edit.chapters.updateFailed')
          : t('edit.chapters.createFailed'),
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
    t('edit.chapters.deleteConfirm'),
  );

  if (!confirmed) {
    return;
  }

  setChapterMessage(null);
  setChapterError(null);

  try {
    setDeletingChapterId(chapterId);
    await courseService.deleteChapter(courseId, chapterId);
    const freshCourse = normalizeStructureCourse(
      await courseService.getAdminCourseById(courseId),
    );
    setCourse(freshCourse);
    setChapterMessage(t('edit.chapters.deleted'));

    if (!editingChapterId || editingChapterId === chapterId) {
      resetChapterForm(freshCourse);
    }

    if (subChapterForm.chapterId === chapterId) {
      resetSubChapterForm(undefined, freshCourse.chapters);
    }
  } catch (error) {
    setChapterError(
      getApiErrorMessage(
        error,
        t('edit.chapters.deleteFailed'),
      ),
    );
  } finally {
    setDeletingChapterId(null);
  }
}
