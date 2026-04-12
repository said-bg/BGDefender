import { Course } from '@/services/course';
import type { AdminDashboardT } from './adminDashboard.types';

export function getCourseTitle(course: Course, language: string) {
  return language === 'fi' ? course.titleFi : course.titleEn;
}

export function formatCourseLevel(level: Course['level'], t: AdminDashboardT) {
  return level === 'premium'
    ? t('levels.premium', { defaultValue: 'Premium' })
    : t('levels.free', { defaultValue: 'Free' });
}

export function formatCourseStatus(
  status: Course['status'],
  t: AdminDashboardT,
) {
  switch (status) {
    case 'published':
      return t('status.published', { defaultValue: 'Published' });
    case 'archived':
      return t('status.archived', { defaultValue: 'Archived' });
    default:
      return t('status.draft', { defaultValue: 'Draft' });
  }
}

export function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown update';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

