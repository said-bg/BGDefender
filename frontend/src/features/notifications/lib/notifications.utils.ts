import { NotificationRecord, NotificationType } from '@/types/api';

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

export const getNotificationTitle = (
  notification: NotificationRecord,
  t: TranslateFn,
): string => {
  switch (notification.type) {
    case NotificationType.COURSE_PUBLISHED:
      return t('notifications.coursePublishedTitle', {
        defaultValue: 'New course published',
      });
    case NotificationType.RESOURCE_SHARED:
      return t('notifications.resourceSharedTitle', {
        defaultValue: 'New resource shared',
      });
    case NotificationType.CERTIFICATE_AVAILABLE:
      return t('notifications.certificateAvailableTitle', {
        defaultValue: 'Certificate available',
      });
    case NotificationType.COMPLETE_PROFILE_FOR_CERTIFICATE:
      return t('notifications.completeProfileTitle', {
        defaultValue: 'Complete your profile',
      });
    default:
      return t('notifications.defaultTitle', {
        defaultValue: 'New update',
      });
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
        defaultValue: `"${courseTitle}" is now available in the course library.`,
      });
    case NotificationType.RESOURCE_SHARED:
      return t('notifications.resourceSharedBody', {
        defaultValue: `"${notification.resourceTitle || 'A private resource'}" has been shared with you.`,
      });
    case NotificationType.CERTIFICATE_AVAILABLE:
      return t('notifications.certificateAvailableBody', {
        defaultValue: `Your certificate for "${courseTitle}" is now ready.`,
      });
    case NotificationType.COMPLETE_PROFILE_FOR_CERTIFICATE:
      return t('notifications.completeProfileBody', {
        defaultValue: `You passed "${courseTitle}". Add your first and last name to generate your certificate.`,
      });
    default:
      return t('notifications.defaultBody', {
        defaultValue: 'You have a new update in your learning space.',
      });
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
