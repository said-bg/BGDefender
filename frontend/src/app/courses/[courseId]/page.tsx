import type { Metadata } from 'next';
import { headers } from 'next/headers';
import CourseDetailPage from '@/features/courses/course-detail/CourseDetailPage';
import {
  buildRouteMetadata,
  DEFAULT_LOCALE,
  normalizeLocale,
} from '@/lib/locale';
import {
  buildCourseMetadata,
  fetchPublishedCourseForSeo,
} from '@/lib/courseSeo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const headerList = await headers();
  const locale = normalizeLocale(
    headerList.get('x-current-locale') ?? DEFAULT_LOCALE,
  );
  const pathname = headerList.get('x-current-path') ?? `/courses/${courseId}`;
  const course = await fetchPublishedCourseForSeo(courseId);

  if (!course) {
    return buildRouteMetadata(locale, pathname);
  }

  return buildCourseMetadata(locale, course);
}

export default CourseDetailPage;
