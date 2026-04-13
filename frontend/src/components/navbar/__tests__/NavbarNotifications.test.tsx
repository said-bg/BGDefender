import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NavbarNotifications from '../NavbarNotifications';
import type { NotificationFeedResponse } from '@/types/api';
import { NotificationType } from '@/types/api';

const mockGetMyNotifications = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/services/notifications', () => ({
  __esModule: true,
  default: {
    getMyNotifications: (...args: unknown[]) => mockGetMyNotifications(...args),
    markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
    markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: Record<string, string>) => {
      const values: Record<string, string> = {
        'notifications.trigger': 'Notifications',
        'notifications.title': 'Notifications',
        'notifications.markAllRead': 'Mark all as read',
        'notifications.clearAll': 'Clear all',
        'notifications.loading': 'Loading notifications...',
        'notifications.empty':
          'No notifications yet. New course updates and learner alerts will appear here.',
        'notifications.resourceSharedTitle': 'New resource shared',
        'notifications.resourceSharedBody':
          `"${options?.resourceTitle ?? ''}" has been shared with you.`,
        'notifications.privateResourceFallback': 'A private resource',
      };

      return values[key] ?? key;
    },
  }),
}));

const createFeed = (): NotificationFeedResponse => ({
  unreadCount: 1,
  data: [
    {
      id: 'notification-1',
      type: NotificationType.RESOURCE_SHARED,
      courseId: null,
      courseTitleEn: null,
      courseTitleFi: null,
      resourceId: 'resource-1',
      resourceTitle: 'Security checklist',
      link: '/resources',
      isRead: false,
      readAt: null,
      createdAt: '2026-04-10T10:30:00.000Z',
    },
  ],
});

describe('NavbarNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMyNotifications.mockResolvedValue(createFeed());
    mockMarkAsRead.mockResolvedValue(undefined);
    mockMarkAllAsRead.mockResolvedValue(undefined);
  });

  it('shows unread notifications and opens the dropdown', async () => {
    render(<NavbarNotifications visible />);

    await waitFor(() => {
      expect(mockGetMyNotifications).toHaveBeenCalled();
    });

    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('New resource shared')).toBeInTheDocument();
    expect(
      screen.getByText('"Security checklist" has been shared with you.'),
    ).toBeInTheDocument();
  });
});
