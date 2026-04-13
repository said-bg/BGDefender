'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import collectionService from '@/services/collections';
import courseService, {
  Course,
  CourseCollection,
  CreateCourseCollectionRequest,
} from '@/services/course';
import {
  moveCollectionCourse,
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

const createInitialFormState = (): CollectionFormState => ({
  titleEn: '',
  titleFi: '',
  descriptionEn: '',
  descriptionFi: '',
  coverImage: '',
  orderIndex: '1',
  isPublished: true,
  courseIds: [],
});

type CollectionImageMode = 'url' | 'upload';

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [collectionRows, courseRows] = await Promise.all([
          collectionService.getAdminCollections(),
          courseService.getAdminCourses(100, 0),
        ]);

        setCollections(collectionRows);
        setAvailableCourses(
          courseRows.data.filter((course) => course.status === 'published'),
        );
      } catch (loadError) {
        console.error('Failed to load collections:', loadError);
        setError(
          t('collections.failedToLoad', {
            defaultValue: 'Failed to load collections.',
          }),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [t]);

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
    setEditingCollectionId(null);
    setForm(createInitialFormState());
    setImageMode('url');
    setCoverUploadError(null);
    setUploadedFilename(null);
  };

  const updateForm = <K extends keyof CollectionFormState>(
    key: K,
    value: CollectionFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleToggleCourse = (courseId: string) => {
    setForm((current) => ({
      ...current,
      courseIds: toggleCollectionCourse(current.courseIds, courseId),
    }));
  };

  const handleMoveCourse = (courseId: string, direction: 'up' | 'down') => {
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
      setCoverUploadError(
        t('collections.coverUploadFailed', {
          defaultValue: 'Failed to upload collection cover image.',
        }),
      );
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.titleEn.trim() || !form.titleFi.trim()) {
      setError(
        t('collections.titleRequired', {
          defaultValue: 'Both English and Finnish titles are required.',
        }),
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = buildPayload();
      const saved = editingCollectionId
        ? await collectionService.updateCollection(editingCollectionId, payload)
        : await collectionService.createCollection(payload);

      setCollections((current) => {
        const withoutEdited = current.filter((collection) => collection.id !== saved.id);
        return [...withoutEdited, saved].sort(
          (left, right) => left.orderIndex - right.orderIndex,
        );
      });

      setMessage(
        editingCollectionId
          ? t('collections.updated', { defaultValue: 'Collection updated successfully.' })
          : t('collections.created', { defaultValue: 'Collection created successfully.' }),
      );
      resetForm();
    } catch (submitError) {
      console.error('Failed to save collection:', submitError);
      setError(
        editingCollectionId
          ? t('collections.updateFailed', { defaultValue: 'Failed to update collection.' })
          : t('collections.createFailed', { defaultValue: 'Failed to create collection.' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (collection: CourseCollection) => {
    setDeletingId(collection.id);
    setError(null);
    setMessage(null);

    try {
      await collectionService.deleteCollection(collection.id);
      setCollections((current) => current.filter((item) => item.id !== collection.id));
      setMessage(
        t('collections.deleted', { defaultValue: 'Collection deleted successfully.' }),
      );

      if (editingCollectionId === collection.id) {
        resetForm();
      }
    } catch (deleteError) {
      console.error('Failed to delete collection:', deleteError);
      setError(
        t('collections.deleteFailed', { defaultValue: 'Failed to delete collection.' }),
      );
    } finally {
      setDeletingId(null);
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
    handleMoveCourse,
    handleSubmit,
    handleToggleCourse,
    imageMode,
    isUploadingCover,
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

