'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Author } from '@/services/course';
import { sortAuthorsByUpdatedAt } from './authorAdmin.utils';
import { deleteAuthor, loadAuthors, saveAuthor, uploadAuthorPhoto } from './authorAdmin.mutations';
import { AuthorFormState, initialAuthorFormState, PhotoMode } from './types';

export default function useAdminAuthors() {
  const { t } = useTranslation('admin');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [deletingAuthorId, setDeletingAuthorId] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<PhotoMode>('url');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [uploadedPhotoFilename, setUploadedPhotoFilename] = useState<string | null>(null);
  const [form, setForm] = useState<AuthorFormState>(initialAuthorFormState);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        setAuthors(await loadAuthors(t));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t('authors.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [t]);

  const orderedAuthors = useMemo(() => sortAuthorsByUpdatedAt(authors), [authors]);

  const resetForm = (options?: { preserveFeedback?: boolean }) => {
    setForm(initialAuthorFormState);
    setEditingAuthorId(null);
    setPhotoMode('url');
    setPhotoUploadError(null);
    setUploadedPhotoFilename(null);

    if (!options?.preserveFeedback) {
      setSubmitError(null);
      setSubmitMessage(null);
    }
  };

  const setField = <K extends keyof AuthorFormState>(field: K, value: AuthorFormState[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const hydrateFormFromAuthor = (author: Author) => {
    setEditingAuthorId(author.id);
    setSubmitError(null);
    setSubmitMessage(null);
    setPhotoMode('url');
    setPhotoUploadError(null);
    setUploadedPhotoFilename(null);
    setForm({
      name: author.name || '',
      roleEn: author.roleEn || '',
      roleFi: author.roleFi || '',
      biographyEn: author.biographyEn || '',
      biographyFi: author.biographyFi || '',
      photo: author.photo || '',
    });
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploadError(null);

    try {
      setIsUploadingPhoto(true);
      const response = await uploadAuthorPhoto(file, t);
      setUploadedPhotoFilename(response.filename);
      setField('photo', response.url);
    } catch (error) {
      setPhotoUploadError(error instanceof Error ? error.message : t('authors.photoUploadFailed'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitMessage(null);

    if (!form.name.trim()) {
      setSubmitError(t('authors.nameRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      const { author, message } = await saveAuthor(form, editingAuthorId, t);

      setAuthors((previous) =>
        editingAuthorId
          ? previous.map((entry) => (entry.id === editingAuthorId ? author : entry))
          : [author, ...previous],
      );
      setSubmitMessage(message);
      resetForm({ preserveFeedback: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('authors.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (author: Author) => {
    const confirmed = window.confirm(
      t('authors.deleteConfirm'),
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAuthorId(author.id);
      await deleteAuthor(author, t);
      setAuthors((previous) => previous.filter((entry) => entry.id !== author.id));

      if (editingAuthorId === author.id) {
        resetForm();
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('authors.deleteFailed'));
    } finally {
      setDeletingAuthorId(null);
    }
  };

  return {
    authors: orderedAuthors,
    deletingAuthorId,
    editingAuthorId,
    form,
    handleDelete,
    handlePhotoUpload,
    handleSubmit,
    hydrateFormFromAuthor,
    isSubmitting,
    isUploadingPhoto,
    loadError,
    loading,
    photoMode,
    photoUploadError,
    resetForm,
    setField,
    setPhotoMode,
    submitError,
    submitMessage,
    t,
    uploadedPhotoFilename,
  };
}

