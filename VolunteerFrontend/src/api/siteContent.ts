import { apiClient } from './client';

export interface SiteContentItem { key: string; value: string; updatedAt: string; }

/** Редактируемые тексты статических страниц. Чтение публично; изменение и сброс — администратор. */
export const siteContentApi = {
  getAll: async (): Promise<SiteContentItem[]> =>
    (await apiClient.get<SiteContentItem[]>('/api/site-content')).data,

  save: async (key: string, value: string): Promise<SiteContentItem> =>
    (await apiClient.put<SiteContentItem>(`/api/admin/site-content/${encodeURIComponent(key)}`, { value })).data,

  /** Возвращает исходный текст страницы (удаляет изменение). */
  reset: async (key: string): Promise<void> => {
    await apiClient.delete(`/api/admin/site-content/${encodeURIComponent(key)}`);
  },
};
