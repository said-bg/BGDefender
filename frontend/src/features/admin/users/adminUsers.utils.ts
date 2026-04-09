import { User, UserPlan, UserRole } from '@/types/api';

export const getAdminUserDisplayName = (user: User) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email.split('@')[0];
};

export const getAdminUserInitials = (user: User) => {
  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  return initials || user.email.slice(0, 1).toUpperCase();
};

export const canToggleCreator = (user: User) => user.role !== UserRole.ADMIN;

export const canManagePlan = (user: User) => user.role !== UserRole.ADMIN;

export const getNextCreatorRole = (user: User) =>
  user.role === UserRole.CREATOR ? UserRole.USER : UserRole.CREATOR;

export const getNextPlan = (user: User) =>
  user.plan === UserPlan.PREMIUM ? UserPlan.FREE : UserPlan.PREMIUM;
