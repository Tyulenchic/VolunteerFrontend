import { apiClient } from './client';

/** Ответ администратора: ушёл автору письмом с почтового ящика сайта. */
export interface FeedbackReply {
  id: string;
  message: string;
  adminId: string | null;
  /** Имя администратора; пустое, если у него не заполнен профиль. */
  adminName: string | null;
  createdAt: string;
}

export const FEEDBACK_REPLY_MAX_LENGTH = 5000;

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  replies: FeedbackReply[];
}

export interface FeedbackPage { items: FeedbackItem[]; totalCount: number; skip: number; take: number; }

/** Обратная связь: отправка — всем (см. FeedbackContext), просмотр и обработка — администратору. */
export const feedbackApi = {
  list: async (skip: number, take: number, isRead?: boolean): Promise<FeedbackPage> =>
    (await apiClient.get<FeedbackPage>('/api/feedback', { params: { skip, take, ...(isRead === undefined ? {} : { isRead }) } })).data,

  get: async (id: string): Promise<FeedbackItem> => (await apiClient.get<FeedbackItem>(`/api/feedback/${id}`)).data,

  /** Отправляет ответ автору письмом с ящика сайта; сохраняется только после успешной отправки (иначе 503). */
  reply: async (id: string, message: string): Promise<FeedbackReply> =>
    (await apiClient.post<FeedbackReply>(`/api/feedback/${id}/replies`, { message })).data,

  markRead: async (id: string): Promise<void> => { await apiClient.post(`/api/feedback/${id}/read`); },

  markAllRead: async (): Promise<void> => { await apiClient.post('/api/feedback/read-all'); },

  remove: async (id: string): Promise<void> => { await apiClient.delete(`/api/feedback/${id}`); },
};
