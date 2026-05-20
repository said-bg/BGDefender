import type { MetadataRoute } from 'next';
import { getMetadataBase, localizePathname } from '@/lib/locale';

export default function robots(): MetadataRoute.Robots {
  const metadataBase = getMetadataBase();
  const disallowedInternalPaths = [
    '/admin/',
    '/creator/',
    '/account/',
    '/favorites/',
    '/my-courses/',
    '/resources/',
    '/certificates/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/unauthorized',
  ];
  const disallow = Array.from(
    new Set([
      ...disallowedInternalPaths,
      ...disallowedInternalPaths.flatMap((pathname) => [
        localizePathname(pathname, 'fi'),
        localizePathname(pathname, 'en'),
      ]),
    ]),
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${metadataBase.toString().replace(/\/$/, '')}/sitemap.xml`,
  };
}
