import {
  localizePathname,
  normalizeLocale,
  type AppLocale,
} from '@/lib/locale';
import type { Course } from './course.types';

type PublicCourseReference = Pick<Course, 'id' | 'slugEn' | 'slugFi'>;

export const getPublicCourseIdentifier = (
  course: PublicCourseReference,
  locale: AppLocale = 'en',
): string => {
  const localizedSlug =
    locale === 'fi' ? course.slugFi?.trim() : course.slugEn?.trim();

  return localizedSlug || course.slugEn?.trim() || course.id;
};

export const buildPublicCoursePath = (
  course: PublicCourseReference,
  locale?: AppLocale | string,
): string => {
  const normalizedLocale = locale ? normalizeLocale(locale) : undefined;
  const pathname = `/courses/${getPublicCourseIdentifier(course, normalizedLocale ?? 'en')}`;

  if (!normalizedLocale) {
    return pathname;
  }

  return localizePathname(pathname, normalizedLocale);
};
