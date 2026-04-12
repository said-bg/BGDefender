import type { User } from '@/types/api';

export const getHomeWelcomeName = (user: Pick<User, 'firstName' | 'email'> | null) => {
  const firstName = user?.firstName?.trim();

  if (firstName) {
    return firstName;
  }

  return user?.email?.split('@')[0] || 'Learner';
};

export const isProfileComplete = (
  user: Pick<User, 'firstName' | 'lastName'> | null,
) => Boolean(user?.firstName?.trim() && user?.lastName?.trim());
