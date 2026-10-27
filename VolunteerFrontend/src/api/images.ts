import { apiClient } from './client';
import type { ImageCropDto, StagedImage } from '../types/organization';

/** Добавляет кадр в multipart-форму загрузки: поля cropX/cropY/cropWidth/cropHeight (все четыре или ни одного). */
export function appendCrop(form: FormData, crop?: ImageCropDto | null): void {
  if (!crop) return;
  form.append('cropX', String(crop.x));
  form.append('cropY', String(crop.y));
  form.append('cropWidth', String(crop.width));
  form.append('cropHeight', String(crop.height));
}

/**
 * Фото можно загрузить ДО создания мероприятия, новости или публикации (идентификатора ещё нет):
 * сервер возвращает id, который затем передаётся как imageId при создании. Неиспользованные загрузки
 * сервер удаляет через сутки.
 */
export const imagesApi = {
  stage: async (file: File): Promise<StagedImage> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<StagedImage>('/api/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000, // 15 МБ по медленному каналу
    });
    return data;
  },

  /** Предпросмотр непубличного изображения (черновик, ещё не привязанная загрузка) — запрос с токеном, ответ — Blob. */
  preview: async (id: string, thumbnail = false): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(`/api/images/${id}/preview`, {
      params: { thumbnail }, responseType: 'blob',
    });
    return data;
  },
};
