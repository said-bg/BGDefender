import { Course } from '@/services/course';
import { formatSiteDate } from '@/lib/datetime';
import type { AdminDashboardT } from './adminDashboard.types';

export function getCourseTitle(course: Course, language: string) {
  return language === 'fi' ? course.titleFi : course.titleEn;
}

export function formatCourseLevel(level: Course['level'], t: AdminDashboardT) {
  return level === 'premium' ? t('levels.premium') : t('levels.free');
}

export function formatCourseStatus(
  status: Course['status'],
  t: AdminDashboardT,
) {
  switch (status) {
    case 'published':
      return t('status.published');
    default:
      return t('status.draft');
  }
}

export function formatUpdatedAt(value: string, language: string) {
  const locale = language === 'fi' ? 'fi' : 'en';

  return formatSiteDate(value, locale, {
    month: 'short',
    day: 'numeric',
  });
}

