import type { MetadataRoute } from 'next';
import {
  buildPublicCourseSeoPath,
  fetchAllPublishedCoursesForSeo,
} from '@/lib/courseSeo';
import {
  getMetadataBase,
  localizePathname,
  SUPPORTED_LOCALES,
  type AppLocale,
} from '@/lib/locale';

const PUBLIC_PATHS = ['/', '/contact', '/courses'] as const;

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getMetadataBase().toString().replace(/\/$/, '');
  const lastModified = new Date();
  const publishedCourses = await fetchAllPublishedCoursesForSeo();
  const staticEntries = PUBLIC_PATHS.flatMap((pathname) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: `${siteUrl}${localizePathname(pathname, locale as AppLocale)}`,
      lastModified,
      alternates: {
        languages: Object.fromEntries(
          SUPPORTED_LOCALES.map((alternateLocale) => [
            alternateLocale,
            `${siteUrl}${localizePathname(pathname, alternateLocale as AppLocale)}`,
          ]),
        ),
      },
    })),
  );
  const courseEntries = publishedCourses.flatMap((course) =>
    SUPPORTED_LOCALES.map((locale) => {
      const normalizedLocale = locale as AppLocale;
      const localizedPath = buildPublicCourseSeoPath(course, normalizedLocale);

      return {
        url: `${siteUrl}${localizePathname(localizedPath, normalizedLocale)}`,
        lastModified,
        alternates: {
          languages: {
            fi: `${siteUrl}${localizePathname(
              buildPublicCourseSeoPath(course, 'fi'),
              'fi',
            )}`,
            en: `${siteUrl}${localizePathname(
              buildPublicCourseSeoPath(course, 'en'),
              'en',
            )}`,
          },
        },
      };
    }),
  );

  return [...staticEntries, ...courseEntries];
}
