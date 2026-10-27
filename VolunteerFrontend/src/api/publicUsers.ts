import { apiClient } from './client';
import type { UserListResponseDto, PublicUserDto } from '../types/user';

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

  getCities: async (): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>('/api/users/cities');
    return data;
  },

  getById: async (id: string): Promise<PublicUserDto> => {
    const { data } = await apiClient.get<PublicUserDto>(`/api/users/${id}`);
    return data;
  },
};
