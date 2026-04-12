import apiClient from '../api/apiClient';
import type { NotificationFeedResponse } from '@/types/api';

const notificationService = {
  async getMyNotifications(limit = 8): Promise<NotificationFeedResponse> {
    const response = await apiClient.get<NotificationFeedResponse>('/notifications/me', {
      params: { limit },
    });

    return response.data;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/me/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/me/read-all');
  },
};

export default notificationService;
