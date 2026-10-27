import { apiClient } from './client';

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface FeedbackPage { items: FeedbackItem[]; totalCount: number; skip: number; take: number; }

/** Обратная связь: отправка — всем (см. FeedbackContext), просмотр и обработка — администратору. */
export const feedbackApi = {
  list: async (skip: number, take: number, isRead?: boolean): Promise<FeedbackPage> =>
    (await apiClient.get<FeedbackPage>('/api/feedback', { params: { skip, take, ...(isRead === undefined ? {} : { isRead }) } })).data,

  get: async (id: string): Promise<FeedbackItem> => (await apiClient.get<FeedbackItem>(`/api/feedback/${id}`)).data,

  markRead: async (id: string): Promise<void> => { await apiClient.post(`/api/feedback/${id}/read`); },

  markAllRead: async (): Promise<void> => { await apiClient.post('/api/feedback/read-all'); },

  remove: async (id: string): Promise<void> => { await apiClient.delete(`/api/feedback/${id}`); },
};
