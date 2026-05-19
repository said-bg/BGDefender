import { UserRole } from '@/types/api';

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

  if (requestedPath === '/unauthorized') {
    return getDefaultRedirectPath(role);
  }

  const creatorAdminPaths = ['/admin/courses', '/admin/authors'];
  const canCreatorAccessAdminPath =
    role === UserRole.CREATOR &&
    creatorAdminPaths.some(
      (path) => requestedPath === path || requestedPath.startsWith(`${path}/`),
    );

  if (
    requestedPath.startsWith('/admin') &&
    role !== UserRole.ADMIN &&
    !canCreatorAccessAdminPath
  ) {
    return getDefaultRedirectPath(role);
  }

  if (requestedPath.startsWith('/creator') && role !== UserRole.CREATOR) {
    return getDefaultRedirectPath(role);
  }

  if (
    role === UserRole.ADMIN &&
    ['/favorites', '/my-courses', '/resources', '/certificates'].some(
      (path) => requestedPath === path || requestedPath.startsWith(`${path}/`),
    )
  ) {
    return '/admin';
  }

  return requestedPath;
};
