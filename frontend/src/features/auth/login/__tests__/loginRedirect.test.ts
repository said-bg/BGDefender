import { UserRole } from '@/types/api';
import { getDefaultRedirectPath, getSafeRedirectPath } from '../loginRedirect';

describe('loginRedirect', () => {
  it('returns role-based default redirect paths', () => {
    expect(getDefaultRedirectPath(UserRole.USER)).toBe('/');
    expect(getDefaultRedirectPath(UserRole.CREATOR)).toBe('/');
    expect(getDefaultRedirectPath(UserRole.ADMIN)).toBe('/admin');
  });

  it('allows creators to return to shared course and author management routes', () => {
    expect(getSafeRedirectPath('/admin/courses', UserRole.CREATOR)).toBe(
      '/admin/courses',
    );
    expect(getSafeRedirectPath('/admin/courses/course-1/edit', UserRole.CREATOR)).toBe(
      '/admin/courses/course-1/edit',
    );
    expect(getSafeRedirectPath('/admin/authors', UserRole.CREATOR)).toBe(
      '/admin/authors',
    );
  });

  it('blocks creators from admin-only areas', () => {
    expect(getSafeRedirectPath('/admin', UserRole.CREATOR)).toBe('/');
    expect(getSafeRedirectPath('/admin/users', UserRole.CREATOR)).toBe('/');
    expect(getSafeRedirectPath('/admin/resources', UserRole.CREATOR)).toBe('/');
  });

  it('keeps admins inside the admin workspace for learner-only surfaces', () => {
    expect(getSafeRedirectPath('/favorites', UserRole.ADMIN)).toBe('/admin');
    expect(getSafeRedirectPath('/my-courses', UserRole.ADMIN)).toBe('/admin');
    expect(getSafeRedirectPath('/resources', UserRole.ADMIN)).toBe('/admin');
    expect(getSafeRedirectPath('/certificates', UserRole.ADMIN)).toBe('/admin');
  });

  it('blocks non-creators from creator studio routes', () => {
    expect(getSafeRedirectPath('/creator', UserRole.USER)).toBe('/');
    expect(getSafeRedirectPath('/creator', UserRole.ADMIN)).toBe('/admin');
  });

  it('falls back safely for invalid or unsafe redirects', () => {
    expect(getSafeRedirectPath(null, UserRole.USER)).toBe('/');
    expect(getSafeRedirectPath('/', UserRole.CREATOR)).toBe('/');
    expect(getSafeRedirectPath('https://evil.test', UserRole.ADMIN)).toBe('/admin');
    expect(getSafeRedirectPath('/unauthorized', UserRole.ADMIN)).toBe('/admin');
  });
});
