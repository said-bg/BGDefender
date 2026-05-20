import { UserRole } from '@/types/api';
import { stripLocaleFromPathname } from '@/lib/locale';

export const getDefaultRedirectPath = (role: UserRole) => {
  if (role === UserRole.ADMIN) {
    return '/admin';
  }

  return '/';
};

export const getSafeRedirectPath = (requestedPath: string | null, role: UserRole) => {
  if (!requestedPath || requestedPath === '/') {
    return getDefaultRedirectPath(role);
  }

  if (!requestedPath.startsWith('/')) {
    return getDefaultRedirectPath(role);
  }

  const normalizedRequestedPath = stripLocaleFromPathname(requestedPath);

  if (normalizedRequestedPath === '/unauthorized') {
    return getDefaultRedirectPath(role);
  }

  const creatorAdminPaths = ['/admin/courses', '/admin/authors'];
  const canCreatorAccessAdminPath =
    role === UserRole.CREATOR &&
    creatorAdminPaths.some(
      (path) =>
        normalizedRequestedPath === path ||
        normalizedRequestedPath.startsWith(`${path}/`),
    );

  if (
    normalizedRequestedPath.startsWith('/admin') &&
    role !== UserRole.ADMIN &&
    !canCreatorAccessAdminPath
  ) {
    return getDefaultRedirectPath(role);
  }

  if (normalizedRequestedPath.startsWith('/creator') && role !== UserRole.CREATOR) {
    return getDefaultRedirectPath(role);
  }

  if (
    role === UserRole.ADMIN &&
    ['/favorites', '/my-courses', '/resources', '/certificates'].some(
      (path) =>
        normalizedRequestedPath === path ||
        normalizedRequestedPath.startsWith(`${path}/`),
    )
  ) {
    return '/admin';
  }

  return requestedPath;
};
