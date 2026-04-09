'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resourceService } from '@/services';
import type { Resource } from '@/types/api';
import { ResourceSource, ResourceType } from '@/types/api';
import { getResourcesSummary } from './resources.utils';

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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ResourceType>('all');
  const [form, setForm] = useState<ResourceFormState>(defaultFormState);

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
          : t('loadFailed', { defaultValue: 'Failed to load resources.' });
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

  const resetForm = () => {
    setForm(defaultFormState);
    setUploadError(null);
  };

  const handleUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setMessage(null);

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
          : t('createFailed', { defaultValue: 'Failed to save resource.' }),
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
      setError(t('validationTitle', { defaultValue: 'A title is required.' }));
      return;
    }

    if (form.type === ResourceType.FILE && !form.fileUrl) {
      setError(
        t('validationFile', {
          defaultValue: 'Upload a document before saving this resource.',
        }),
      );
      return;
    }

    if (form.type === ResourceType.LINK && !isProbablyUrl(form.linkUrl.trim())) {
      setError(
        t('validationLink', {
          defaultValue: 'A valid link is required.',
        }),
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
        t('createSuccess', { defaultValue: 'Resource saved successfully.' }),
      );
      resetForm();
      await loadResources();
    } catch (submitFailure) {
      setError(
        submitFailure instanceof Error
          ? submitFailure.message
          : t('createFailed', { defaultValue: 'Failed to save resource.' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (resource.source === ResourceSource.ADMIN) {
      setError(
        t('cannotDeleteAdmin', {
          defaultValue: 'Admin-shared resources cannot be deleted from your space.',
        }),
      );
      return;
    }

    const confirmed = window.confirm(
      t('deleteConfirm', {
        defaultValue: 'Delete this resource? This action cannot be undone.',
      }),
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
        t('deleteSuccess', { defaultValue: 'Resource deleted successfully.' }),
      );
      await loadResources();
    } catch (deleteFailure) {
      setError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : t('deleteFailed', { defaultValue: 'Failed to delete resource.' }),
      );
    } finally {
      setDeletingId(null);
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
    search,
    setSearch,
    setTypeFilter,
    submitting,
    summary,
    t,
    typeFilter,
    updateForm,
    uploadError,
  };
}
