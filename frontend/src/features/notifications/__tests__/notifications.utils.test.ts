import {
  formatNotificationTimestamp,
  getNotificationBody,
  getNotificationTitle,
} from '../lib/notifications.utils';
import { NotificationType, type NotificationRecord } from '@/types/api';

const translate = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key;

const createNotification = (
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord => ({
  id: 'notification-1',
  type: NotificationType.CERTIFICATE_AVAILABLE,
  courseId: 'course-1',
  courseTitleEn: 'How to Protect Yourself Online',
  courseTitleFi: 'How to Protect Yourself Online',
  resourceId: null,
  resourceTitle: null,
  link: '/certificates',
  isRead: false,
  readAt: null,
  createdAt: '2026-04-10T10:30:00.000Z',
  ...overrides,
});

describe('notifications.utils', () => {
  it('builds a clean title and body for certificate notifications', () => {
    const notification = createNotification();

    expect(getNotificationTitle(notification, translate)).toBe('Certificate available');
    expect(getNotificationBody(notification, 'en', translate)).toBe(
      'Your certificate for "How to Protect Yourself Online" is now ready.',
    );
  });

  it('formats timestamps for display', () => {
    const formatted = formatNotificationTimestamp('2026-04-10T10:30:00.000Z', 'en');

    expect(formatted).toMatch(/10 Apr|Apr 10/);
  });
});
