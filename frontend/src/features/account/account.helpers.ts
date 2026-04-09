import { User, UserPlan, UserRole } from '@/types/api';
import type { PasswordCheck } from './account.types';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

type AccountTranslationFn = (key: string) => string;

export const getAccountDisplayName = (user: User | null) => {
  if (!user) {
    return '';
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email.split('@')[0];
};

export const getAccountAvatarText = (user: User | null) => {
  if (!user) {
    return 'U';
  }

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  return initials || user.email.slice(0, 1).toUpperCase();
};

export const getAccountPlanLabel = (user: User | null, tNavbar: AccountTranslationFn) => {
  if (!user) {
    return '';
  }

  return user.plan === UserPlan.PREMIUM ? tNavbar('badges.premium') : tNavbar('badges.free');
};

export const getAccountRoleLabel = (user: User | null, tNavbar: AccountTranslationFn) => {
  if (!user) {
    return '';
  }

  if (user.role === UserRole.ADMIN) {
    return tNavbar('badges.admin');
  }

  if (user.role === UserRole.CREATOR) {
    return tNavbar('badges.creator');
  }

  return tNavbar('badges.user');
};

export const getAccountJoinedAt = (user: User | null) => {
  if (!user?.createdAt) {
    return '-';
  }

  return new Date(user.createdAt).toLocaleDateString();
};

export const validatePasswordChange = ({
  confirmPassword,
  currentPassword,
  newPassword,
  tAccount,
  tAuth,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  tAccount: AccountTranslationFn;
  tAuth: AccountTranslationFn;
}) => {
  if (!currentPassword.trim()) {
    return tAccount('currentPasswordRequired');
  }

  if (!newPassword.trim()) {
    return tAccount('newPasswordRequired');
  }

  if (!confirmPassword.trim()) {
    return tAccount('confirmPasswordRequired');
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return tAuth('password.minLength');
  }

  if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
    return /[A-Z]/.test(newPassword) ? tAuth('password.noNumber') : tAuth('password.noUppercase');
  }

  if (newPassword === currentPassword) {
    return tAuth('alerts.samePasswordMessage');
  }

  if (newPassword !== confirmPassword) {
    return tAccount('passwordMismatch');
  }

  return null;
};

export const buildPasswordChecks = (
  newPassword: string,
  tAuth: AccountTranslationFn,
): PasswordCheck[] => [
  {
    key: 'length',
    label: tAuth('register.requirement1'),
    isValid: newPassword.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: 'uppercase',
    label: tAuth('register.requirement2'),
    isValid: /[A-Z]/.test(newPassword),
  },
  {
    key: 'number',
    label: tAuth('register.requirement3'),
    isValid: /\d/.test(newPassword),
  },
];
