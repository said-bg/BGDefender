'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import collectionService from '@/services/collections';
import courseService, {
  Course,
  CourseCollection,
  CreateCourseCollectionRequest,
} from '@/services/course';
import {
  getNextCollectionOrderIndex,
  moveCollectionCourse,
  sortCollectionsByOrderIndex,
  toggleCollectionCourse,
} from './collections.utils';

type CollectionFormState = {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  coverImage: string;
  orderIndex: string;
  isPublished: boolean;
  courseIds: string[];
};

const createInitialFormState = (orderIndex = '1'): CollectionFormState => ({
  titleEn: '',
  titleFi: '',
  descriptionEn: '',
  descriptionFi: '',
  coverImage: '',
  orderIndex,
  isPublished: true,
  courseIds: [],
});

type CollectionImageMode = 'url' | 'upload';

const scrollToPageTop = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export default function useAdminCollections() {
  const { t, i18n } = useTranslation('admin');
  const [collections, setCollections] = useState<CourseCollection[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CollectionFormState>(createInitialFormState);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<CollectionImageMode>('url');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const showSuccess = (feedback: string) => {
    setError(null);
    setMessage(feedback);
    scrollToPageTop();
  };

  const showError = (feedback: string) => {
    setMessage(null);
    setError(feedback);
    scrollToPageTop();
  };

  const resetFormWithCollections = useCallback((collectionRows: CourseCollection[]) => {
    setEditingCollectionId(null);
    setForm(createInitialFormState(getNextCollectionOrderIndex(collectionRows)));
    setImageMode('url');
    setCoverUploadError(null);
    setUploadedFilename(null);
  }, []);

  const syncFormOrderWithCollections = (collectionRows: CourseCollection[]) => {
    if (!editingCollectionId) {
      setForm((current) => ({
        ...current,
        orderIndex: getNextCollectionOrderIndex(collectionRows),
      }));
      return;
    }

    const editedCollection = collectionRows.find(
      (collection) => collection.id === editingCollectionId,
    );

    if (!editedCollection) {
      return;
    }

    setForm((current) => ({
      ...current,
      orderIndex: String(editedCollection.orderIndex),
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [collectionRows, courseRows] = await Promise.all([
          collectionService.getAdminCollections(),
          courseService.getAdminCourses(100, 0),
        ]);

        const orderedCollections = sortCollectionsByOrderIndex(collectionRows);
        setCollections(orderedCollections);
        resetFormWithCollections(orderedCollections);
        setAvailableCourses(
          courseRows.data.filter((course) => course.status === 'published'),
        );
      } catch (loadError) {
        console.error('Failed to load collections:', loadError);
        setError(t('collections.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [resetFormWithCollections, t]);

  const preparedCollections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return collections.filter((collection) => {
      if (!normalizedSearch) {
        return true;
      }

      const title =
        i18n.language === 'fi' ? collection.titleFi : collection.titleEn;
      const fallbackTitle =
        i18n.language === 'fi' ? collection.titleEn : collection.titleFi;

      return [title, fallbackTitle, collection.descriptionEn, collection.descriptionFi]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [collections, i18n.language, search]);

  const selectedCourses = useMemo(
    () =>
      form.courseIds
        .map((courseId) => availableCourses.find((course) => course.id === courseId))
        .filter((course): course is Course => Boolean(course)),
    [availableCourses, form.courseIds],
  );

  const summary = useMemo(() => {
    const totalCoursesAssigned = collections.reduce(
      (sum, collection) => sum + collection.courses.length,
      0,
    );

    return {
      total: collections.length,
      published: collections.filter((collection) => collection.isPublished).length,
      hidden: collections.filter((collection) => !collection.isPublished).length,
      assignedCourses: totalCoursesAssigned,
    };
  }, [collections]);

  const resetForm = () => {
    clearFeedback();
    resetFormWithCollections(collections);
  };

  const updateForm = <K extends keyof CollectionFormState>(
    key: K,
    value: CollectionFormState[K],
  ) => {
    clearFeedback();
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleToggleCourse = (courseId: string) => {
    clearFeedback();
    setForm((current) => ({
      ...current,
      courseIds: toggleCollectionCourse(current.courseIds, courseId),
    }));
  };

  const handleMoveCourse = (courseId: string, direction: 'up' | 'down') => {
    clearFeedback();
    setForm((current) => ({
      ...current,
      courseIds: moveCollectionCourse(current.courseIds, courseId, direction),
    }));
  };

  const startEdit = (collection: CourseCollection) => {
    setEditingCollectionId(collection.id);
    setError(null);
    setMessage(null);
    setCoverUploadError(null);
    setUploadedFilename(null);
    setImageMode(collection.coverImage ? 'upload' : 'url');
    setForm({
      titleEn: collection.titleEn,
      titleFi: collection.titleFi,
      descriptionEn: collection.descriptionEn ?? '',
      descriptionFi: collection.descriptionFi ?? '',
      coverImage: collection.coverImage ?? '',
      orderIndex: String(collection.orderIndex),
      isPublished: collection.isPublished,
      courseIds: collection.courses.map((course) => course.id),
    });
  };

  const buildPayload = (): CreateCourseCollectionRequest => ({
    titleEn: form.titleEn.trim(),
    titleFi: form.titleFi.trim(),
    descriptionEn: form.descriptionEn.trim() || null,
    descriptionFi: form.descriptionFi.trim() || null,
    coverImage: form.coverImage.trim() || null,
    orderIndex: Number.parseInt(form.orderIndex, 10) || 1,
    isPublished: form.isPublished,
    courseIds: form.courseIds,
  });

  const handleImageModeChange = (mode: CollectionImageMode) => {
    clearFeedback();
    setImageMode(mode);
    setCoverUploadError(null);
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    setCoverUploadError(null);

    try {
      const response = await collectionService.uploadCollectionCover(file);
      setForm((current) => ({
        ...current,
        coverImage: response.url,
      }));
      setUploadedFilename(response.filename);
      setImageMode('upload');
    } catch (uploadError) {
      console.error('Failed to upload collection cover:', uploadError);
      setCoverUploadError(t('collections.coverUploadFailed'));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async () => {
    clearFeedback();

    if (!form.titleEn.trim() || !form.titleFi.trim()) {
      showError(t('collections.titleRequired'));
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload();
      if (editingCollectionId) {
        await collectionService.updateCollection(editingCollectionId, payload);
      } else {
        await collectionService.createCollection(payload);
      }
      const freshCollections = sortCollectionsByOrderIndex(
        await collectionService.getAdminCollections(),
      );
      setCollections(freshCollections);

      showSuccess(
        editingCollectionId
          ? t('collections.updated')
          : t('collections.created'),
      );
      resetFormWithCollections(freshCollections);
    } catch (submitError) {
      console.error('Failed to save collection:', submitError);
      showError(
        editingCollectionId
          ? t('collections.updateFailed')
          : t('collections.createFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (collection: CourseCollection) => {
    setDeletingId(collection.id);
    clearFeedback();

    try {
      await collectionService.deleteCollection(collection.id);
      const freshCollections = sortCollectionsByOrderIndex(
        await collectionService.getAdminCollections(),
      );
      setCollections(freshCollections);
      showSuccess(t('collections.deleted'));

      if (editingCollectionId === collection.id) {
        resetFormWithCollections(freshCollections);
      } else {
        syncFormOrderWithCollections(freshCollections);
      }
    } catch (deleteError) {
      console.error('Failed to delete collection:', deleteError);
      setError(t('collections.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleMoveCollection = async (
    collectionId: string,
    direction: 'up' | 'down',
  ) => {
    const orderedCollections = sortCollectionsByOrderIndex(collections);
    const currentIndex = orderedCollections.findIndex(
      (collection) => collection.id === collectionId,
    );

    if (currentIndex === -1) {
      return;
    }

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= orderedCollections.length) {
      return;
    }

    clearFeedback();

    try {
      await collectionService.updateCollection(collectionId, {
        orderIndex: nextIndex + 1,
      });
      const freshCollections = sortCollectionsByOrderIndex(
        await collectionService.getAdminCollections(),
      );
      setCollections(freshCollections);
      syncFormOrderWithCollections(freshCollections);
    } catch (moveError) {
      console.error('Failed to reorder collection:', moveError);
      showError(t('collections.updateFailed'));
    }
  };

  return {
    availableCourses,
    deletingId,
    editingCollectionId,
    error,
    form,
    coverUploadError,
    handleDelete,
    handleCoverUpload,
    handleImageModeChange,
    handleMoveCollection,
    handleMoveCourse,
    handleSubmit,
    handleToggleCourse,
    imageMode,
    isUploadingCover,
    language: i18n.language,
    loading,
    message,
    preparedCollections,
    resetForm,
    search,
    selectedCourses,
    setSearch,
    startEdit,
    submitting,
    summary,
    t,
    uploadedFilename,
    updateForm,
  };
}

