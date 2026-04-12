import { FormEvent, useEffect, useMemo, useState } from 'react';
import courseService, { Author, Course } from '@/services/course';
import type { TranslationFn } from '@/types/i18n';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  CoverImageMode,
  EditCourseFormState,
  initialFormState,
} from '../lib/details.types';
import {
  buildUpdateCoursePayload,
  getLocalizedCourseTitle,
  mapCourseToForm,
  uploadCourseCover,
  validateCourseDetailsForm,
} from '../lib/details.helpers';
import { loadCourseDetailsPageData } from '../lib/details.data';

type UseEditCourseDetailsParams = {
  courseId?: string;
  language: string;
  onSuccessRedirect: () => void;
  t: TranslationFn;
};

export function useEditCourseDetails({
  courseId,
  language,
  onSuccessRedirect,
  t,
}: UseEditCourseDetailsParams) {
  const [form, setForm] = useState<EditCourseFormState>(initialFormState);
  const [course, setCourse] = useState<Course | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState<CoverImageMode>('url');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setLoadError(
        t('edit.missingCourseId', {
          defaultValue: 'Missing course id.',
        }),
      );
      setLoadingPage(false);
      return;
    }

    const loadPageData = async () => {
      try {
        setLoadingPage(true);
        setLoadError(null);
        setAuthorsError(null);

        const pageData = await loadCourseDetailsPageData(courseId);
        setCourse(pageData.course);
        setAuthors(pageData.authors);
        setForm(mapCourseToForm(pageData.course));
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          t('edit.failedToLoad', {
            defaultValue: 'Failed to load course data.',
          }),
        );

        setLoadError(message);
        setAuthorsError(message);
      } finally {
        setLoadingPage(false);
      }
    };

    void loadPageData();
  }, [courseId, t]);

  const localizedCourseTitle = useMemo(() => {
    return getLocalizedCourseTitle(course, language);
  }, [course, language]);

  const selectedAuthors = useMemo(
    () => authors.filter((author) => form.authorIds.includes(author.id)),
    [authors, form.authorIds],
  );

  const toggleAuthor = (authorId: string) => {
    setForm((previous) => ({
      ...previous,
      authorIds: previous.authorIds.includes(authorId)
        ? previous.authorIds.filter((id) => id !== authorId)
        : [...previous.authorIds, authorId],
    }));
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploadError(null);

    try {
      setIsUploadingCover(true);
      const response = await uploadCourseCover(file);
      setUploadedFilename(response.filename);
      setForm((previous) => ({
        ...previous,
        coverImage: response.url,
      }));
      setImageMode('upload');
    } catch (error) {
      setCoverUploadError(
        getApiErrorMessage(
          error,
          t('create.coverUploadFailed', {
            defaultValue: 'Failed to upload cover image.',
          }),
        ),
      );
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitMessage(null);

    if (!courseId) {
      setSubmitError(
        t('edit.missingCourseId', {
          defaultValue: 'Missing course id.',
        }),
      );
      return;
    }

    const validationError = validateCourseDetailsForm(form, t);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    const payload = buildUpdateCoursePayload(form);

    try {
      setIsSubmitting(true);
      const updatedCourse = await courseService.updateCourse(courseId, payload);
      setCourse(updatedCourse);
      setSubmitMessage(
        t('edit.success', {
          defaultValue: 'Course updated successfully. Redirecting to course management...',
        }),
      );
      setTimeout(onSuccessRedirect, 900);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          t('edit.failed', {
            defaultValue: 'Failed to update course.',
          }),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    authors,
    authorsError,
    coverUploadError,
    form,
    imageMode,
    isSubmitting,
    isUploadingCover,
    loadError,
    loadingPage,
    localizedCourseTitle,
    selectedAuthors,
    submitError,
    submitMessage,
    uploadedFilename,
    setForm,
    setImageMode,
    toggleAuthor,
    handleCoverUpload,
    handleSubmit,
  };
}

