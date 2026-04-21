import { NotificationType } from '../../entities/notification.entity';

export type NotificationView = {
  id: string;
  type: NotificationType;
  courseId: string | null;
  courseTitleEn: string | null;
  courseTitleFi: string | null;
  resourceId: string | null;
  resourceTitle: string | null;
  link: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationDraft = {
  userId: number;
  type: NotificationType;
  courseId?: string | null;
  courseTitleEnSnapshot?: string | null;
  courseTitleFiSnapshot?: string | null;
  resourceId?: string | null;
  resourceTitleSnapshot?: string | null;
  link: string | null;
};
