'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/utils/apiError';
import { confirmWithModal } from '@/utils/modalFeedback';
import { resourceService, userService } from '@/services';
import type {
  CreateAdminResourceRequest,
  CreateResourceGroupRequest,
  Resource,
  ResourceGroup,
  ResourceType,
  UpdateResourceGroupRequest,
  User,
} from '@/types/api';
import { ResourceSource, ResourceType as ResourceTypeEnum, UserRole } from '@/types/api';

type ResourceForm = {
  assignedGroupId: string;
  title: string;
  description: string;
  assignedUserId: string;
  targetType: 'user' | 'group';
  type: ResourceType;
  linkUrl: string;
  fileUrl: string;
  filename: string;
  mimeType: string;
};

const INITIAL_FORM: ResourceForm = {
  assignedGroupId: '',
  title: '',
  description: '',
  assignedUserId: '',
  targetType: 'user',
  type: ResourceTypeEnum.FILE,
  linkUrl: '',
  fileUrl: '',
  filename: '',
  mimeType: '',
};

type ResourceGroupForm = {
  id: string | null;
  title: string;
  description: string;
  memberUserIds: string[];
};

const INITIAL_GROUP_FORM: ResourceGroupForm = {
  id: null,
  title: '',
  description: '',
  memberUserIds: [],
};

export default function useAdminResources() {
  const { t } = useTranslation('admin');
  const [resources, setResources] = useState<Resource[]>([]);
  const [groups, setGroups] = useState<ResourceGroup[]>([]);
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
  const [groupForm, setGroupForm] = useState<ResourceGroupForm>(INITIAL_GROUP_FORM);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
    setUploadError(null);
  };

  const clearGroupFeedback = () => {
    setGroupError(null);
    setGroupMessage(null);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [resourceResponse, userResponse, groupResponse] = await Promise.all([
          resourceService.getAdminResources({
            limit: 100,
            search: search.trim() || undefined,
            source: ResourceSource.ADMIN,
            type: typeFilter === 'all' ? undefined : typeFilter,
          }),
          userService.getAdminUsers({ limit: 100 }),
          resourceService.getAdminResourceGroups(),
        ]);

        setResources(resourceResponse.data);
        setUsers(userResponse.data.filter((user) => user.role !== UserRole.ADMIN));
        setGroups(groupResponse);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            t('resources.failedToLoad'),
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

  const updateGroupForm = <K extends keyof ResourceGroupForm>(
    key: K,
    value: ResourceGroupForm[K],
  ) => {
    clearGroupFeedback();
    setGroupForm((previous) => ({ ...previous, [key]: value }));
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
        t('resources.uploaded'),
      );
    } catch (uploadErr) {
      setUploadError(
        getApiErrorMessage(
          uploadErr,
          t('resources.uploadFailed'),
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const assignedUserId = Number(form.assignedUserId);

    if (!form.title.trim()) {
      setError(t('resources.validationTitle'));
      return;
    }

    if (form.targetType === 'user' && !assignedUserId) {
      setError(
        t('resources.validationRequired'),
      );
      return;
    }

    if (form.targetType === 'group' && !form.assignedGroupId) {
      setError(t('resources.validationGroup'));
      return;
    }

    if (form.type === ResourceTypeEnum.FILE && !form.fileUrl) {
      setError(
        t('resources.validationFile'),
      );
      return;
    }

    if (form.type === ResourceTypeEnum.LINK && !form.linkUrl.trim()) {
      setError(
        t('resources.validationLink'),
      );
      return;
    }

    const payload: CreateAdminResourceRequest = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      fileUrl: form.type === ResourceTypeEnum.FILE ? form.fileUrl : undefined,
      filename: form.type === ResourceTypeEnum.FILE ? form.filename : undefined,
      mimeType: form.type === ResourceTypeEnum.FILE ? form.mimeType : undefined,
      linkUrl:
        form.type === ResourceTypeEnum.LINK ? form.linkUrl.trim() : undefined,
      assignedGroupId:
        form.targetType === 'group' ? form.assignedGroupId : undefined,
      assignedUserId:
        form.targetType === 'user' ? assignedUserId : undefined,
    };

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      const created = await resourceService.createAdminResource(payload);
      setResources((previous) => [created, ...previous]);
      setMessage(
        t('resources.created'),
      );
      setForm(INITIAL_FORM);
      setUploadError(null);
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          t('resources.createFailed'),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    const confirmed = await confirmWithModal({
      title: t('resources.delete'),
      message: t('resources.deleteConfirm'),
      confirmLabel: t('resources.delete'),
      type: 'warning',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(resource.id);
      setError(null);
      setMessage(null);
      await resourceService.deleteAdminResource(resource.id);
      setResources((previous) => previous.filter((entry) => entry.id !== resource.id));
      setMessage(
        t('resources.deleted'),
      );
    } catch (deleteError) {
      setError(
        getApiErrorMessage(
          deleteError,
          t('resources.deleteFailed'),
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const startEditingGroup = (group: ResourceGroup) => {
    clearGroupFeedback();
    setGroupForm({
      id: group.id,
      title: group.title,
      description: group.description ?? '',
      memberUserIds: group.members.map((member) => String(member.id)),
    });
  };

  const cancelEditingGroup = () => {
    clearGroupFeedback();
    setGroupForm(INITIAL_GROUP_FORM);
  };

  const handleSubmitGroup = async () => {
    if (!groupForm.title.trim()) {
      setGroupError(t('resources.groups.validationTitle'));
      return;
    }

    try {
      setGroupSubmitting(true);
      clearGroupFeedback();

      if (groupForm.id) {
        const payload: UpdateResourceGroupRequest = {
          title: groupForm.title.trim(),
          description: groupForm.description.trim() || null,
          memberUserIds: groupForm.memberUserIds.map((value) => Number(value)),
        };
        const updated = await resourceService.updateAdminResourceGroup(groupForm.id, payload);
        setGroups((previous) =>
          previous.map((entry) => (entry.id === updated.id ? updated : entry)),
        );
        setResources((previous) =>
          previous.map((resource) =>
            resource.assignedGroupId === updated.id
              ? {
                  ...resource,
                  assignedGroup: {
                    id: updated.id,
                    title: updated.title,
                    description: updated.description,
                    memberCount: updated.memberCount,
                  },
                }
              : resource,
          ),
        );
        setGroupMessage(t('resources.groups.updated'));
      } else {
        const payload: CreateResourceGroupRequest = {
          title: groupForm.title.trim(),
          description: groupForm.description.trim() || null,
          memberUserIds: groupForm.memberUserIds.map((value) => Number(value)),
        };
        const created = await resourceService.createAdminResourceGroup(payload);
        setGroups((previous) => [created, ...previous]);
        setGroupMessage(t('resources.groups.created'));
      }

      setGroupForm(INITIAL_GROUP_FORM);
    } catch (groupFailure) {
      setGroupError(
        getApiErrorMessage(groupFailure, t('resources.groups.saveFailed')),
      );
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleDeleteGroup = async (group: ResourceGroup) => {
    const confirmed = await confirmWithModal({
      title: t('resources.groups.delete'),
      message: t('resources.groups.deleteConfirm'),
      confirmLabel: t('resources.groups.delete'),
      type: 'warning',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingGroupId(group.id);
      clearGroupFeedback();
      await resourceService.deleteAdminResourceGroup(group.id);
      setGroups((previous) => previous.filter((entry) => entry.id !== group.id));
      if (groupForm.id === group.id) {
        setGroupForm(INITIAL_GROUP_FORM);
      }
      setGroupMessage(t('resources.groups.deleted'));
    } catch (groupFailure) {
      setGroupError(
        getApiErrorMessage(groupFailure, t('resources.groups.deleteFailed')),
      );
    } finally {
      setDeletingGroupId(null);
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
          t('resources.openFailed'),
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
    const groupTargets = resources.filter((resource) => resource.assignedGroupId).length;

    return { adminSent, files, groupTargets, links, total };
  }, [resources]);

  return {
    cancelEditingGroup,
    deletingId,
    deletingGroupId,
    error,
    form,
    groupError,
    groupForm,
    groupMessage,
    groupSubmitting,
    groups,
    handleDelete,
    handleDeleteGroup,
    handleOpenFile,
    handleSubmit,
    handleSubmitGroup,
    handleUpload,
    isUploading,
    loading,
    message,
    openingId,
    resources,
    search,
    setSearch: updateSearch,
    setTypeFilter: updateTypeFilter,
    startEditingGroup,
    submitting,
    summary,
    t,
    typeFilter,
    updateForm,
    updateGroupForm,
    uploadError,
    users,
  };
}
