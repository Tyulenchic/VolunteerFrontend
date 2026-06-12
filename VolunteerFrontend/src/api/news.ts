import { apiClient } from './client';

export interface NewsResponseDto {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  status: 'Draft' | 'Published' | 'Archived';
  createdByUserId: string;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
  category?: string;
}

export interface NewsListResponseDto {
  items: NewsResponseDto[];
  totalCount: number;
  skip: number;
  take: number;
}

export const newsApi = {
  // ── Public ────────────────────────────────────────────────────────────────
  getActual: async (skip = 0, take = 10, search?: string): Promise<NewsListResponseDto> => {
    const { data } = await apiClient.get<NewsListResponseDto>('/api/news/actual', {
      params: { skip, take, ...(search ? { search } : {}) },
    });
    return data;
  },
  getAll: async (skip = 0, take = 20, search?: string): Promise<NewsListResponseDto> => {
    const { data } = await apiClient.get<NewsListResponseDto>('/api/news', {
      params: { skip, take, ...(search ? { search } : {}) },
    });
    return data;
  },
  getById: async (id: string): Promise<NewsResponseDto> => {
    const { data } = await apiClient.get<NewsResponseDto>(`/api/news/${id}`);
    return data;
  },

  // ── Admin: image management ──────────────────────────────────────────────
  uploadImage: async (id: string, file: File): Promise<NewsResponseDto> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<NewsResponseDto>(`/api/news/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};