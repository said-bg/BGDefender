'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import authorService from '@/services/authors';
import courseService, { Author, CreateCourseRequest } from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import { CreateCourseFormState, ImageMode, initialCreateCourseFormState } from './types';

export default function useCreateCourse() {
  const { t } = useTranslation('admin');
  const router = useRouter();
  const [form, setForm] = useState<CreateCourseFormState>(initialCreateCourseFormState);
  const [imageMode, setImageMode] = useState<ImageMode>('url');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthors = async () => {
      try {
        setLoadingAuthors(true);
        setAuthorsError(null);
        const response = await authorService.getAuthors(100, 0);
        setAuthors(response.data);
      } catch (error) {
        setAuthorsError(
          getApiErrorMessage(error, t('create.authorsFailed')),
        );
      } finally {
        setLoadingAuthors(false);
      }
    };

    void loadAuthors();
  }, [t]);

  const selectedAuthors = useMemo(
    () => authors.filter((author) => form.authorIds.includes(author.id)),
    [authors, form.authorIds],
  );

  const setField = <K extends keyof CreateCourseFormState>(
    field: K,
    value: CreateCourseFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

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
      const response = await courseService.uploadCourseCover(file);
      setUploadedFilename(response.filename);
      setField('coverImage', response.url);
    } catch (error) {
      setCoverUploadError(
        getApiErrorMessage(error, t('create.coverUploadFailed')),
      );
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitMessage(null);

    if (!form.titleEn.trim() || !form.titleFi.trim()) {
      setSubmitError(t('create.titleRequired'));
      return;
    }

    if (!form.descriptionEn.trim() || !form.descriptionFi.trim()) {
      setSubmitError(t('create.descriptionRequired'));
      return;
    }

    const durationValue = form.estimatedDuration.trim();
    if (durationValue && Number(durationValue) <= 0) {
      setSubmitError(t('create.durationInvalid'));
      return;
    }

    const payload: CreateCourseRequest = {
      titleEn: form.titleEn.trim(),
      titleFi: form.titleFi.trim(),
      descriptionEn: form.descriptionEn.trim(),
      descriptionFi: form.descriptionFi.trim(),
      level: form.level,
      status: form.status,
      estimatedDuration: durationValue ? Number(durationValue) : undefined,
      coverImage: form.coverImage.trim() || undefined,
      authorIds: form.authorIds.length ? form.authorIds : undefined,
    };

    try {
      setIsSubmitting(true);
      await courseService.createCourse(payload);
      setSubmitMessage(t('create.success'));
      setForm(initialCreateCourseFormState);
      setTimeout(() => {
        router.push('/admin/courses');
      }, 900);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, t('create.failed')),
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
    loadingAuthors,
    selectedAuthors,
    submitError,
    submitMessage,
    uploadedFilename,
    handleCoverUpload,
    handleSubmit,
    setField,
    setImageMode,
    toggleAuthor,
  };
}

