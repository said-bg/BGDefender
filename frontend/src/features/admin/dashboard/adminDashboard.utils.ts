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

export function formatAuditDateTime(value: string, language: string) {
  const locale = language === 'fi' ? 'fi' : 'en';

  return formatSiteDate(value, locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getActorName(
  actor: Course['owner'] | Course['createdBy'] | Course['lastEditedBy'] | Course['publishedBy'],
  fallback: string,
) {
  if (!actor) {
    return fallback;
  }

  const fullName = `${actor.firstName || ''} ${actor.lastName || ''}`.trim();

  if (/^admin user$/i.test(fullName) || /^admin@/i.test(actor.email)) {
    return 'Admin';
  }

  return fullName || actor.email;
}

