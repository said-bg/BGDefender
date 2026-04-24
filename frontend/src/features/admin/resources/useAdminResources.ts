'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/utils/apiError';
import { resourceService, userService } from '@/services';
import type {
  CreateAdminResourceRequest,
  Resource,
  ResourceType,
  User,
} from '@/types/api';
import { ResourceSource, ResourceType as ResourceTypeEnum, UserRole } from '@/types/api';

type ResourceForm = {
  title: string;
  description: string;
  assignedUserId: string;
  type: ResourceType;
  linkUrl: string;
  fileUrl: string;
  filename: string;
  mimeType: string;
};

const INITIAL_FORM: ResourceForm = {
  title: '',
  description: '',
  assignedUserId: '',
  type: ResourceTypeEnum.FILE,
  linkUrl: '',
  fileUrl: '',
  filename: '',
  mimeType: '',
};

export default function useAdminResources() {
  const { t } = useTranslation('admin');
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ResourceType>('all');
  const [form, setForm] = useState<ResourceForm>(INITIAL_FORM);

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
    setUploadError(null);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [resourceResponse, userResponse] = await Promise.all([
          resourceService.getAdminResources({
            limit: 100,
            search: search.trim() || undefined,
            source: ResourceSource.ADMIN,
            type: typeFilter === 'all' ? undefined : typeFilter,
          }),
          userService.getAdminUsers({ limit: 100 }),
        ]);

        setResources(resourceResponse.data);
        setUsers(userResponse.data.filter((user) => user.role !== UserRole.ADMIN));
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            t('resources.failedToLoad', {
              defaultValue: 'Failed to load resources.',
            }),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [search, t, typeFilter]);

  const updateForm = <K extends keyof ResourceForm>(key: K, value: ResourceForm[K]) => {
    clearFeedback();
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updateSearch = (value: string) => {
    clearFeedback();
    setSearch(value);
  };

  const updateTypeFilter = (value: 'all' | ResourceType) => {
    clearFeedback();
    setTypeFilter(value);
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      clearFeedback();
      const uploaded = await resourceService.uploadResource(file);
      setForm((previous) => ({
        ...previous,
        type: ResourceTypeEnum.FILE,
        fileUrl: uploaded.url,
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
      }));
      setMessage(
        t('resources.uploaded', {
          defaultValue: 'Document uploaded successfully.',
        }),
      );
    } catch (uploadErr) {
      setUploadError(
        getApiErrorMessage(
          uploadErr,
          t('resources.uploadFailed', {
            defaultValue: 'Failed to upload document.',
          }),
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const assignedUserId = Number(form.assignedUserId);

    if (!form.title.trim() || !assignedUserId) {
      setError(
        t('resources.validationRequired', {
          defaultValue: 'Title and target user are required.',
        }),
      );
      return;
    }

    if (form.type === ResourceTypeEnum.FILE && !form.fileUrl) {
      setError(
        t('resources.validationFile', {
          defaultValue: 'Upload a document before saving this resource.',
        }),
      );
      return;
    }

    if (form.type === ResourceTypeEnum.LINK && !form.linkUrl.trim()) {
      setError(
        t('resources.validationLink', {
          defaultValue: 'Add a link before saving this resource.',
        }),
      );
      return;
    }

    const payload: CreateAdminResourceRequest = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      assignedUserId,
      type: form.type,
      fileUrl: form.type === ResourceTypeEnum.FILE ? form.fileUrl : undefined,
      filename: form.type === ResourceTypeEnum.FILE ? form.filename : undefined,
      mimeType: form.type === ResourceTypeEnum.FILE ? form.mimeType : undefined,
      linkUrl:
        form.type === ResourceTypeEnum.LINK ? form.linkUrl.trim() : undefined,
    };

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      const created = await resourceService.createAdminResource(payload);
      setResources((previous) => [created, ...previous]);
      setMessage(
        t('resources.created', {
          defaultValue: 'Resource sent successfully.',
        }),
      );
      setForm(INITIAL_FORM);
      setUploadError(null);
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          t('resources.createFailed', {
            defaultValue: 'Failed to create resource.',
          }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    try {
      setDeletingId(resource.id);
      setError(null);
      setMessage(null);
      await resourceService.deleteAdminResource(resource.id);
      setResources((previous) => previous.filter((entry) => entry.id !== resource.id));
      setMessage(
        t('resources.deleted', {
          defaultValue: 'Resource deleted successfully.',
        }),
      );
    } catch (deleteError) {
      setError(
        getApiErrorMessage(
          deleteError,
          t('resources.deleteFailed', {
            defaultValue: 'Failed to delete resource.',
          }),
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenFile = async (resource: Resource) => {
    try {
      setOpeningId(resource.id);
      clearFeedback();
      await resourceService.openResourceFile(resource);
    } catch (openError) {
      setError(
        getApiErrorMessage(
          openError,
          t('resources.openFailed', {
            defaultValue: 'Failed to open document.',
          }),
        ),
      );
    } finally {
      setOpeningId(null);
    }
  };

  const summary = useMemo(() => {
    const total = resources.length;
    const files = resources.filter((resource) => resource.type === ResourceTypeEnum.FILE).length;
    const links = resources.filter((resource) => resource.type === ResourceTypeEnum.LINK).length;
    const adminSent = resources.filter(
      (resource) => resource.source === ResourceSource.ADMIN,
    ).length;

    return { adminSent, files, links, total };
  }, [resources]);

  return {
    deletingId,
    error,
    form,
    handleDelete,
    handleOpenFile,
    handleSubmit,
    handleUpload,
    isUploading,
    loading,
    message,
    openingId,
    resources,
    search,
    setSearch: updateSearch,
    setTypeFilter: updateTypeFilter,
    submitting,
    summary,
    t,
    typeFilter,
    updateForm,
    uploadError,
    users,
  };
}
