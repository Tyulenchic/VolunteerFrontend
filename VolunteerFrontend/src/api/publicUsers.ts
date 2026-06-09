import { apiClient } from './client';
import type { UserListResponseDto, UserResponseDto } from '../types/user';

export const publicUsersApi = {
  getOrganizers: async (skip = 0, take = 50, search?: string): Promise<UserListResponseDto> => {
    const { data } = await apiClient.get<UserListResponseDto>('/api/users/organizers', {
      params: { skip, take, ...(search ? { search } : {}) },
    });
    return data;
  },

  getVolunteers: async (skip = 0, take = 50, search?: string): Promise<UserListResponseDto> => {
    const { data } = await apiClient.get<UserListResponseDto>('/api/users/volunteers', {
      params: { skip, take, ...(search ? { search } : {}) },
    });
    return data;
  },

  getById: async (id: string): Promise<UserResponseDto> => {
    const { data } = await apiClient.get<UserResponseDto>(`/api/users/${id}`);
    return data;
  },
};
