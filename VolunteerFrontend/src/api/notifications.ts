import { apiClient } from './client';

/** Уведомление пользователя. data — JSON с идентификаторами для перехода (eventId, newsId, organizationId, postId). */
export interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  data: string | null;
}

export interface NotificationPage { items: UserNotification[]; totalCount: number; skip: number; take: number; }

/** Общие уведомления для любой роли: решения по заявкам, новое содержимое организаций, служебные события. */
export const notificationsApi = {
  list: async (skip: number, take: number, isRead?: boolean): Promise<NotificationPage> =>
    (await apiClient.get<NotificationPage>('/api/notifications', { params: { skip, take, ...(isRead === undefined ? {} : { isRead }) } })).data,

  unreadCount: async (): Promise<number> =>
    (await apiClient.get<{ count: number }>('/api/notifications/unread-count')).data.count,

  markRead: async (id: string): Promise<void> => { await apiClient.post(`/api/notifications/${id}/read`); },

  markAllRead: async (): Promise<void> => { await apiClient.post('/api/notifications/read-all'); },
};
