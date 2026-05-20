import type { Metadata } from 'next';
import type { Course } from '@/services/course/course.types';
import {
  getMetadataBase,
  localizePathname,
  type AppLocale,
} from './locale';

const COURSE_METADATA_FALLBACK_IMAGE = '/assets/images/bgdefender.jpeg';
const COURSE_METADATA_MAX_DESCRIPTION_LENGTH = 160;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const trimCourseDescription = (value: string): string => {
  const normalized = value.trim().replace(/\s+/g, ' ');

  if (normalized.length <= COURSE_METADATA_MAX_DESCRIPTION_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, COURSE_METADATA_MAX_DESCRIPTION_LENGTH - 1).trim()}...`;
};

const getLocalizedCourseField = (
  locale: AppLocale,
  valueEn: string,
  valueFi: string,
): string => {
  const preferred = locale === 'fi' ? valueFi : valueEn;
  const fallback = locale === 'fi' ? valueEn : valueFi;

  return (preferred || fallback || '').trim();
};

export const getPublicCourseSeoIdentifier = (
  course: Pick<Course, 'id' | 'slugEn' | 'slugFi'>,
  locale: AppLocale = 'en',
): string => {
  const localizedSlug =
    locale === 'fi' ? course.slugFi?.trim() : course.slugEn?.trim();

  return localizedSlug || course.slugEn?.trim() || course.id;
};

export const buildPublicCourseSeoPath = (
  course: Pick<Course, 'id' | 'slugEn' | 'slugFi'>,
  locale: AppLocale = 'en',
): string => `/courses/${getPublicCourseSeoIdentifier(course, locale)}`;

export const buildCourseMetadata = (
  locale: AppLocale,
  course: Pick<
    Course,
    | 'id'
    | 'slugEn'
    | 'slugFi'
    | 'titleEn'
    | 'titleFi'
    | 'descriptionEn'
    | 'descriptionFi'
    | 'coverImage'
  >,
): Metadata => {
  const title = getLocalizedCourseField(locale, course.titleEn, course.titleFi);
  const description = trimCourseDescription(
    getLocalizedCourseField(locale, course.descriptionEn, course.descriptionFi),
  );
  const coursePath = buildPublicCourseSeoPath(course, locale);
  const canonical = localizePathname(coursePath, locale);
  const imageUrl = course.coverImage || COURSE_METADATA_FALLBACK_IMAGE;

  return {
    title: `${title} | Defender Academy`,
    description,
    metadataBase: getMetadataBase(),
    alternates: {
      canonical,
      languages: {
        fi: localizePathname(buildPublicCourseSeoPath(course, 'fi'), 'fi'),
        en: localizePathname(buildPublicCourseSeoPath(course, 'en'), 'en'),
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Defender Academy',
      locale,
      type: 'article',
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

export const fetchPublishedCourseForSeo = async (
  identifier: string,
): Promise<Course | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${identifier}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Course;
  } catch {
    return null;
  }
};

export const fetchAllPublishedCoursesForSeo = async (): Promise<Course[]> => {
  const collectedCourses: Course[] = [];
  const limit = 100;
  let offset = 0;
  let totalCount = Number.POSITIVE_INFINITY;

  try {
    while (offset < totalCount) {
      const response = await fetch(
        `${API_BASE_URL}/courses?limit=${limit}&offset=${offset}`,
        {
          next: { revalidate: 300 },
        },
      );

      if (!response.ok) {
        break;
      }

      const payload = (await response.json()) as {
        data: Course[];
        count: number;
      };

      collectedCourses.push(...payload.data);
      totalCount = payload.count;
      offset += payload.data.length;

      if (payload.data.length === 0) {
        break;
      }
    }
  } catch {
    return [];
  }

  return collectedCourses;
};
