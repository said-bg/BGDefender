'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resourceService } from '@/services';
import type { Resource } from '@/types/api';
import { ResourceSource, ResourceType } from '@/types/api';
import { getApiErrorMessage } from '@/utils/apiError';
import { getResourcesSummary } from '../lib/resources.utils';

type ResourceFormState = {
  description: string;
  fileUrl: string;
  filename: string;
  linkUrl: string;
  mimeType: string;
  title: string;
  type: ResourceType;
};

const defaultFormState: ResourceFormState = {
  description: '',
  fileUrl: '',
  filename: '',
  linkUrl: '',
  mimeType: '',
  title: '',
  type: ResourceType.FILE,
};

const isProbablyUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function useResourcesPage() {
  const { t } = useTranslation('resources');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ResourceType>('all');
  const [form, setForm] = useState<ResourceFormState>(defaultFormState);

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
    setUploadError(null);
  };

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await resourceService.getMyResources();
      setResources(Array.isArray(response) ? response : []);
    } catch (loadError) {
      const messageText =
        loadError instanceof Error
          ? loadError.message
          : t('loadFailed');
      setError(messageText);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesType = typeFilter === 'all' || resource.type === typeFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        resource.title.toLowerCase().includes(normalizedSearch) ||
        (resource.description ?? '').toLowerCase().includes(normalizedSearch) ||
        (resource.filename ?? '').toLowerCase().includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [resources, search, typeFilter]);

  const summary = useMemo(() => getResourcesSummary(resources), [resources]);

  const updateForm = <K extends keyof ResourceFormState>(
    field: K,
    value: ResourceFormState[K],
  ) => {
    clearFeedback();
    setForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === 'type') {
        if (value === ResourceType.FILE) {
          next.linkUrl = '';
        } else {
          next.fileUrl = '';
          next.filename = '';
          next.mimeType = '';
        }
      }

      return next;
    });
  };

  const updateSearch = (value: string) => {
    clearFeedback();
    setSearch(value);
  };

  const updateTypeFilter = (value: 'all' | ResourceType) => {
    clearFeedback();
    setTypeFilter(value);
  };

  const handleUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    clearFeedback();

    try {
      const uploaded = await resourceService.uploadResource(file);

      setForm((previous) => ({
        ...previous,
        fileUrl: uploaded.url,
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
      }));
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : t('createFailed'),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setUploadError(null);

    if (!form.title.trim()) {
      setError(t('validationTitle'));
      return;
    }

    if (form.type === ResourceType.FILE && !form.fileUrl) {
      setError(
        t('validationFile'),
      );
      return;
    }

    if (form.type === ResourceType.LINK && !isProbablyUrl(form.linkUrl.trim())) {
      setError(
        t('validationLink'),
      );
      return;
    }

    setSubmitting(true);

    try {
      await resourceService.createMyResource({
        description: form.description.trim() || null,
        fileUrl: form.type === ResourceType.FILE ? form.fileUrl : undefined,
        filename: form.type === ResourceType.FILE ? form.filename : undefined,
        linkUrl: form.type === ResourceType.LINK ? form.linkUrl.trim() : undefined,
        mimeType: form.type === ResourceType.FILE ? form.mimeType : undefined,
        title: form.title.trim(),
        type: form.type,
      });

      setMessage(
        t('createSuccess'),
      );
      setForm(defaultFormState);
      setUploadError(null);
      await loadResources();
    } catch (submitFailure) {
      setError(
        submitFailure instanceof Error
          ? submitFailure.message
          : t('createFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (resource.source === ResourceSource.ADMIN) {
      setError(
        t('cannotDeleteAdmin'),
      );
      return;
    }

    const confirmed = window.confirm(
      t('deleteConfirm'),
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(resource.id);
    setError(null);
    setMessage(null);

    try {
      await resourceService.deleteMyResource(resource.id);
      setMessage(
        t('deleteSuccess'),
      );
      await loadResources();
    } catch (deleteFailure) {
      setError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : t('deleteFailed'),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenFile = async (resource: Resource) => {
    setOpeningId(resource.id);
    clearFeedback();

    try {
      await resourceService.openResourceFile(resource);
    } catch (openFailure) {
      setError(
        getApiErrorMessage(
          openFailure,
          t('openFailed', { defaultValue: 'Failed to open document.' }),
        ),
      );
    } finally {
      setOpeningId(null);
    }
  };

  return {
    deletingId,
    error,
    filteredResources,
    form,
    handleDelete,
    handleSubmit,
    handleUpload,
    isUploading,
    loading,
    message,
    handleOpenFile,
    openingId,
    search,
    setSearch: updateSearch,
    setTypeFilter: updateTypeFilter,
    submitting,
    summary,
    t,
    typeFilter,
    updateForm,
    uploadError,
  };
}
