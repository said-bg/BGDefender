'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '@/services';
import { useAuth } from '@/hooks';
import { User, UserPlan, UserRole } from '@/types/api';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  canManagePlan,
  canToggleCreator,
  getAdminUserDisplayName,
  getAdminUserInitials,
  getNextCreatorRole,
  getNextPlan,
} from './adminUsers.utils';

export default function useAdminUsers() {
  const { t } = useTranslation('admin');
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actingUserId, setActingUserId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | UserPlan>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userService.getAdminUsers({
          limit: 100,
          search: search.trim() || undefined,
          plan: planFilter === 'all' ? undefined : planFilter,
          role: roleFilter === 'all' ? undefined : roleFilter,
        });
        setUsers(response.data);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            t('users.failedToLoad'),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, [planFilter, roleFilter, search, t]);

  const updateUser = async (userId: number, payload: Partial<User>) => {
    try {
      setActingUserId(userId);
      setError(null);
      setMessage(null);
      const updatedUser = await userService.updateAdminUser(userId, payload);
      setUsers((previous) =>
        previous.map((entry) => (entry.id === userId ? updatedUser : entry)),
      );
      setMessage(
        t('users.updated'),
      );
    } catch (updateError) {
      setError(
        getApiErrorMessage(
          updateError,
          t('users.updateFailed'),
        ),
      );
    } finally {
      setActingUserId(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    const confirmed = window.confirm(
      t('users.deleteConfirm'),
    );

    if (!confirmed) {
      return;
    }

    try {
      setActingUserId(user.id);
      setError(null);
      setMessage(null);
      const response = await userService.deleteAdminUser(user.id);
      setUsers((previous) => previous.filter((entry) => entry.id !== user.id));
      setMessage(
        response.message ||
          t('users.deleted'),
      );
    } catch (deleteError) {
      setError(
        getApiErrorMessage(
          deleteError,
          t('users.deleteFailed'),
        ),
      );
    } finally {
      setActingUserId(null);
    }
  };

  const handleTogglePlan = async (user: User) => {
    if (!canManagePlan(user)) {
      return;
    }

    await updateUser(user.id, {
      plan: getNextPlan(user),
    });
  };

  const handleToggleCreator = async (user: User) => {
    if (!canToggleCreator(user)) {
      return;
    }

    await updateUser(user.id, {
      role: getNextCreatorRole(user),
    });
  };

  const handleToggleActive = async (user: User) => {
    await updateUser(user.id, {
      isActive: !user.isActive,
    });
  };

  const preparedUsers = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        displayName: getAdminUserDisplayName(user),
        initials: getAdminUserInitials(user),
        isCurrentAdmin: currentUser?.id === user.id,
      })),
    [currentUser?.id, users],
  );

  const summary = useMemo(() => {
    const visible = preparedUsers.length;
    const premium = preparedUsers.filter((user) => user.plan === UserPlan.PREMIUM).length;
    const creators = preparedUsers.filter((user) => user.role === UserRole.CREATOR).length;
    const inactive = preparedUsers.filter((user) => !user.isActive).length;

    return {
      visible,
      premium,
      creators,
      inactive,
    };
  }, [preparedUsers]);

  return {
    actingUserId,
    canManagePlan,
    error,
    handleDeleteUser,
    handleToggleActive,
    handleToggleCreator,
    handleTogglePlan,
    loading,
    message,
    planFilter,
    preparedUsers,
    roleFilter,
    search,
    setPlanFilter,
    setRoleFilter,
    setSearch,
    summary,
    t,
  };
}
