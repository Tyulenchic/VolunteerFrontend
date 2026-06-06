import { apiClient } from './client';
import type { UserResponseDto, UserListResponseDto, UpdateProfileDto, ChangePasswordDto, UserRole } from '../types/user';

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
  uploadAvatar: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ avatarUrl: string }>('/api/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.avatarUrl;
  },
  deleteAvatar: async (): Promise<void> => {
    await apiClient.delete('/api/users/me/avatar');
  },
  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/api/users/me');
  },
  revokeConsent: async (): Promise<void> => {
    await apiClient.post('/api/users/me/revoke-consent');
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAll: async (skip = 0, take = 20): Promise<UserListResponseDto> => {
    const { data } = await apiClient.get<UserListResponseDto>('/api/users', { params: { skip, take } });
    return data;
  },
  getById: async (id: string): Promise<UserResponseDto> => {
    const { data } = await apiClient.get<UserResponseDto>(`/api/users/${id}`);
    return data;
  },
  block: async (id: string): Promise<void> => {
    await apiClient.post(`/api/users/${id}/block`);
  },
  unblock: async (id: string): Promise<void> => {
    await apiClient.post(`/api/users/${id}/unblock`);
  },
  changeRole: async (id: string, role: UserRole): Promise<void> => {
    await apiClient.put(`/api/users/${id}/role`, JSON.stringify(role), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
