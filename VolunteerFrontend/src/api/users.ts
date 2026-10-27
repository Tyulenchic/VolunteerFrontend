import { apiClient } from './client';
import { appendCrop } from './images';
import { downloadFile, type DossierFormat } from '../utils/downloadFile';
import type { ImageCropDto } from '../types/organization';
import type { UserResponseDto, UpdateProfileDto, ChangePasswordDto } from '../types/user';

export const usersApi = {
  // ── Self ──────────────────────────────────────────────────────────────────
  getMe: async (): Promise<UserResponseDto> => {
    const { data } = await apiClient.get<UserResponseDto>('/api/users/me');
    return data;
  },
  updateProfile: async (dto: UpdateProfileDto): Promise<UserResponseDto> => {
    const { data } = await apiClient.put<UserResponseDto>('/api/users/me', dto);
    return data;
  },
  changePassword: async (dto: ChangePasswordDto): Promise<void> => {
    await apiClient.put('/api/users/me/password', dto);
  },
  // Upload avatar as multipart/form-data
  // Квадратный кадр (доли 0…1) выбирается в редакторе фото; сервер сжимает фото и проверяет пропорции кадра.
  uploadAvatar: async (file: File, crop?: ImageCropDto | null): Promise<void> => {
    const form = new FormData();
    form.append('file', file);
    appendCrop(form, crop);
    await apiClient.post('/api/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  // Только кадр — без повторной загрузки файла и без повторной проверки модератором.
  setAvatarCrop: async (crop: ImageCropDto): Promise<void> => {
    await apiClient.put('/api/users/me/avatar/crop', crop);
  },
  deleteAvatar: async (): Promise<void> => {
    await apiClient.delete('/api/users/me/avatar');
  },
  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/api/users/me');
  },
  /** Скачать все свои данные файлом (Excel / PDF / Word). */
  exportMyData: (format: DossierFormat): Promise<void> =>
    downloadFile('/api/users/me/export', { format }, `moi-dannye.${format}`),
  revokeConsent: async (): Promise<void> => {
    await apiClient.post('/api/users/me/revoke-consent');
  },

};
