import { NotificationRecord, NotificationType } from '@/types/api';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export const getNotificationTitle = (
  notification: NotificationRecord,
  t: TranslateFn,
): string => {
  switch (notification.type) {
    case NotificationType.COURSE_PUBLISHED:
      return t('notifications.coursePublishedTitle');
    case NotificationType.RESOURCE_SHARED:
      return t('notifications.resourceSharedTitle');
    case NotificationType.CERTIFICATE_AVAILABLE:
      return t('notifications.certificateAvailableTitle');
    case NotificationType.COMPLETE_PROFILE_FOR_CERTIFICATE:
      return t('notifications.completeProfileTitle');
    default:
      return t('notifications.defaultTitle');
  }
};

export const getNotificationBody = (
  notification: NotificationRecord,
  language: string,
  t: TranslateFn,
): string => {
  const courseTitle =
    language.startsWith('fi') && notification.courseTitleFi
      ? notification.courseTitleFi
      : notification.courseTitleEn || notification.courseTitleFi || '';

  switch (notification.type) {
    case NotificationType.COURSE_PUBLISHED:
      return t('notifications.coursePublishedBody', {
        courseTitle,
      });
    case NotificationType.RESOURCE_SHARED:
      return t('notifications.resourceSharedBody', {
        resourceTitle: notification.resourceTitle || t('notifications.privateResourceFallback'),
      });
    case NotificationType.CERTIFICATE_AVAILABLE:
      return t('notifications.certificateAvailableBody', {
        courseTitle,
      });
    case NotificationType.COMPLETE_PROFILE_FOR_CERTIFICATE:
      return t('notifications.completeProfileBody', {
        courseTitle,
      });
    default:
      return t('notifications.defaultBody');
  }
};

export const formatNotificationTimestamp = (
  value: string,
  language: string,
): string => {
  return new Intl.DateTimeFormat(language.startsWith('fi') ? 'fi-FI' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};
