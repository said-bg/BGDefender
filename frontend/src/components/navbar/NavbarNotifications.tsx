'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import notificationService from '@/services/notifications';
import { NotificationRecord } from '@/types/api';
import {
  formatNotificationTimestamp,
  getNotificationBody,
  getNotificationTitle,
} from '@/features/notifications/lib/notifications.utils';
import styles from './NavbarNotifications.module.css';

type NavbarNotificationsProps = {
  visible: boolean;
};

export default function NavbarNotifications({ visible }: NavbarNotificationsProps) {
  const { t, i18n } = useTranslation('navbar');
  const router = useRouter();
  const menuId = 'navbar-notifications-panel';
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const hasUnreadNotifications = unreadCount > 0;

  useEffect(() => {
    if (!visible) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible]);

  const loadNotifications = async () => {
    setIsLoading(true);

    try {
      const response = await notificationService.getMyNotifications();
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    void loadNotifications();
  }, [visible]);

  const normalizedLanguage = useMemo(() => i18n.language || 'en', [i18n.language]);

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.notifications} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);

          if (nextOpen) {
            void loadNotifications();
          }
        }}
        aria-label={t('notifications.trigger')}
        aria-controls={isOpen ? menuId : undefined}
      >
        <span className={styles.bellIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" focusable="false">
            <path
              d="M9.5 18h5m-8-2h11.2c.5 0 .8-.5.5-.9l-1.2-1.8V10a5 5 0 1 0-10 0v3.3L6.3 15c-.3.4 0 .9.5.9Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {hasUnreadNotifications ? (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          id={menuId}
          className={styles.menu}
          aria-label={t('notifications.title')}
        >
          <div className={styles.menuHeader}>
            <p className={styles.menuTitle}>
              {t('notifications.title')}
            </p>
            <button
              type="button"
              className={styles.markAllButton}
              disabled={!hasUnreadNotifications || isMarkingAll}
              onClick={async () => {
                setIsMarkingAll(true);

                try {
                  await notificationService.markAllAsRead();
                  setNotifications((current) =>
                    current.map((notification) => ({
                      ...notification,
                      isRead: true,
                      readAt: notification.readAt ?? new Date().toISOString(),
                    })),
                  );
                  setUnreadCount(0);
                } catch (error) {
                  console.error('Failed to mark all notifications as read:', error);
                } finally {
                  setIsMarkingAll(false);
                }
              }}
            >
              {t('notifications.markAllRead')}
            </button>
            <button
              type="button"
              className={styles.clearAllButton}
              disabled={notifications.length === 0 || isClearingAll}
              onClick={async () => {
                setIsClearingAll(true);

                try {
                  await notificationService.clearAll();
                  setNotifications([]);
                  setUnreadCount(0);
                } catch (error) {
                  console.error('Failed to clear notifications:', error);
                } finally {
                  setIsClearingAll(false);
                }
              }}
            >
              {t('notifications.clearAll')}
            </button>
          </div>

          <div className={styles.menuBody}>
            {isLoading ? (
              <p className={styles.loadingState}>
                {t('notifications.loading')}
              </p>
            ) : notifications.length === 0 ? (
              <p className={styles.emptyState}>
                {t('notifications.empty')}
              </p>
            ) : (
              <ul className={styles.notificationList}>
                {notifications.map((notification) => (
                  <li key={notification.id} className={styles.notificationListItem}>
                    <button
                      type="button"
                      className={`${styles.notificationItem} ${
                        notification.isRead ? '' : styles.notificationUnread
                      }`}
                      onClick={async () => {
                        if (!notification.isRead) {
                          try {
                            await notificationService.markAsRead(notification.id);
                            setNotifications((current) =>
                              current.map((currentNotification) =>
                                currentNotification.id === notification.id
                                  ? {
                                      ...currentNotification,
                                      isRead: true,
                                      readAt:
                                        currentNotification.readAt ?? new Date().toISOString(),
                                    }
                                  : currentNotification,
                              ),
                            );
                            setUnreadCount((current) => Math.max(0, current - 1));
                          } catch (error) {
                            console.error('Failed to mark notification as read:', error);
                          }
                        }

                        setIsOpen(false);

                        if (notification.link) {
                          router.push(notification.link);
                        }
                      }}
                    >
                      <span
                        className={`${styles.dot} ${notification.isRead ? styles.dotRead : ''}`}
                        aria-hidden="true"
                      />
                      <span className={styles.notificationCopy}>
                        <span className={styles.notificationTitle}>
                          {getNotificationTitle(notification, t)}
                        </span>
                        <span className={styles.notificationBody}>
                          {getNotificationBody(notification, normalizedLanguage, t)}
                        </span>
                        <span className={styles.notificationMeta}>
                          {formatNotificationTimestamp(notification.createdAt, normalizedLanguage)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
