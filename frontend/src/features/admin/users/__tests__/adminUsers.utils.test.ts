import { UserPlan, UserRole, type User } from '@/types/api';
import {
  canToggleCreator,
  getAdminUserDisplayName,
  getAdminUserInitials,
  getNextCreatorRole,
  getNextPlan,
} from '../adminUsers.utils';

const createUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'user@example.com',
  firstName: 'Said',
  lastName: 'Admin',
  occupation: null,
  role: UserRole.USER,
  plan: UserPlan.FREE,
  isActive: true,
  createdAt: '2026-04-08T10:00:00.000Z',
  updatedAt: '2026-04-08T10:00:00.000Z',
  ...overrides,
});

describe('adminUsers.utils', () => {
  it('builds a display name from first and last name', () => {
    expect(getAdminUserDisplayName(createUser())).toBe('Said Admin');
  });

  it('falls back to email prefix when no profile name exists', () => {
    expect(
      getAdminUserDisplayName(createUser({ firstName: null, lastName: null })),
    ).toBe('user');
  });

  it('builds initials from the user profile', () => {
    expect(getAdminUserInitials(createUser())).toBe('SA');
  });

  it('toggles creator role between user and creator', () => {
    expect(getNextCreatorRole(createUser())).toBe(UserRole.CREATOR);
    expect(getNextCreatorRole(createUser({ role: UserRole.CREATOR }))).toBe(UserRole.USER);
  });

  it('toggles plan between free and premium', () => {
    expect(getNextPlan(createUser())).toBe(UserPlan.PREMIUM);
    expect(getNextPlan(createUser({ plan: UserPlan.PREMIUM }))).toBe(UserPlan.FREE);
  });

  it('does not allow creator toggles for admin users', () => {
    expect(canToggleCreator(createUser({ role: UserRole.ADMIN }))).toBe(false);
  });
});
