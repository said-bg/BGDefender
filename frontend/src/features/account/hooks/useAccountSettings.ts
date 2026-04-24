import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { UserPlan, UserRole } from '@/types/api';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  buildPasswordChecks,
  getAccountAvatarText,
  getAccountDisplayName,
  getAccountJoinedAt,
  getAccountPlanLabel,
  getAccountRoleLabel,
  validatePasswordChange,
} from '../lib/account.helpers';
import styles from '../AccountPage.module.css';
import type { AccountSection, ProfileFormState } from '../lib/account.types';

export function useAccountSettings() {
  const { t: tAccount } = useTranslation('account');
  const { t: tNavbar } = useTranslation('navbar');
  const { t: tAuth } = useTranslation('auth');
  const { user, updateProfile, changePassword } = useAuth();
  const [activeSection, setActiveSection] = useState<AccountSection>('profile');
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    firstName: '',
    lastName: '',
    occupation: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      occupation: user.occupation || '',
    });
  }, [user]);

  const displayName = useMemo(() => getAccountDisplayName(user), [user]);

  const avatarText = useMemo(() => getAccountAvatarText(user), [user]);

  const planLabel = useMemo(() => {
    if (!user) {
      return '';
    }

    return getAccountPlanLabel(user, tNavbar);
  }, [tNavbar, user]);

  const roleLabel = useMemo(() => {
    if (!user) {
      return '';
    }

    return getAccountRoleLabel(user, tNavbar);
  }, [tNavbar, user]);

  const joinedAt = useMemo(() => getAccountJoinedAt(user), [user]);

  const planToneClass = user?.plan === UserPlan.PREMIUM ? styles.premiumTone : styles.freeTone;
  const roleToneClass = !user
    ? ''
    : user.role === UserRole.ADMIN
      ? styles.adminTone
      : user.role === UserRole.CREATOR
        ? styles.creatorTone
        : styles.userTone;

  const updateProfileForm = (value: ProfileFormState) => {
    setProfileError(null);
    setProfileMessage(null);
    setProfileForm(value);
  };

  const updateCurrentPassword = (value: string) => {
    setPasswordError(null);
    setPasswordMessage(null);
    setCurrentPassword(value);
  };

  const updateNewPassword = (value: string) => {
    setPasswordError(null);
    setPasswordMessage(null);
    setNewPassword(value);
  };

  const updateConfirmPassword = (value: string) => {
    setPasswordError(null);
    setPasswordMessage(null);
    setConfirmPassword(value);
  };

  const handleSetActiveSection = (section: AccountSection) => {
    setProfileError(null);
    setProfileMessage(null);
    setPasswordError(null);
    setPasswordMessage(null);
    setActiveSection(section);
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      await updateProfile(profileForm);
      setProfileMessage(tAccount('profileSaved'));
    } catch (error) {
      setProfileError(getApiErrorMessage(error, tAccount('profileFailed')));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    const validationError = validatePasswordChange({
      confirmPassword,
      currentPassword,
      newPassword,
      tAccount,
      tAuth,
    });

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setIsSavingPassword(true);

    try {
      const message = await changePassword(currentPassword, newPassword);
      setPasswordMessage(message || tAccount('passwordSaved'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(getApiErrorMessage(error, tAccount('passwordFailed')));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const passwordChecks = useMemo(() => buildPasswordChecks(newPassword, tAuth), [newPassword, tAuth]);

  return {
    activeSection,
    avatarText,
    confirmPassword,
    currentPassword,
    displayName,
    handlePasswordSubmit,
    handleProfileSubmit,
    isAdmin: user?.role === UserRole.ADMIN,
    isStandardUser: user?.role === UserRole.USER,
    isSavingPassword,
    isSavingProfile,
    joinedAt,
    newPassword,
    passwordChecks,
    passwordError,
    passwordMessage,
    planLabel,
    planToneClass,
    profileError,
    profileForm,
    profileMessage,
    roleLabel,
    roleToneClass,
    setActiveSection: handleSetActiveSection,
    setConfirmPassword: updateConfirmPassword,
    setCurrentPassword: updateCurrentPassword,
    setNewPassword: updateNewPassword,
    setProfileForm: updateProfileForm,
    user,
  };
}
