import { apiClient } from './client';

export interface PendingAvatar {
  userId: string;
  displayName: string;
  uploadedAt: string;
  status: string;
  /** Адрес изображения для проверки: не публичный, загружается запросом с токеном. */
  previewUrl: string;
}

export interface PendingAvatarPage { items: PendingAvatar[]; totalCount: number; }

export const moderationApi = {
  pendingAvatars: async (skip = 0, take = 20): Promise<PendingAvatarPage> =>
    (await apiClient.get<PendingAvatarPage>('/api/admin/moderation/avatars/pending', { params: { skip, take } })).data,

  approveAvatar: async (userId: string): Promise<void> => {
    await apiClient.post(`/api/admin/moderation/avatars/${userId}/approve`);
  },

  /** Изображение удаляется, пользователь получает письмо с причиной. */
  rejectAvatar: async (userId: string, reason: string): Promise<void> => {
    await apiClient.post(`/api/admin/moderation/avatars/${userId}/reject`, { reason });
  },
};
