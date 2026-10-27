import { apiClient } from './client';
import type { EventResponseDto } from '../types/event';
import type {
  CreateOrganizationInput, ImageCropDto, MemberRole, Membership, OrganizationApplication, OrganizationCategory,
  OrganizationDetails, OrganizationInput, OrganizationLevel, OrganizationListItem, OrganizationMember,
  OrganizationPost, OrganizationFeedItem, Paged, PostImageInput, UnassignedOrganizer,
} from '../types/organization';

export interface OrganizationListParams {
  skip?: number;
  take?: number;
  search?: string;
  city?: string;
  level?: OrganizationLevel;
  category?: OrganizationCategory;
}

/** Организации: публичные страницы, заявки на вступление, управление и публикации. */
export const organizationsApi = {
  // ── Публичные страницы ────────────────────────────────────────────────────
  list: async (params: OrganizationListParams = {}): Promise<Paged<OrganizationListItem>> => {
    const { data } = await apiClient.get<Paged<OrganizationListItem>>('/api/organizations', { params });
    return data;
  },
  get: async (id: string): Promise<OrganizationDetails> => {
    const { data } = await apiClient.get<OrganizationDetails>(`/api/organizations/${id}`);
    return data;
  },
  events: async (id: string, skip = 0, take = 20): Promise<Paged<EventResponseDto>> => {
    const { data } = await apiClient.get<Paged<EventResponseDto>>(`/api/organizations/${id}/events`, { params: { skip, take } });
    return data;
  },
  /** Общая лента публикаций всех организаций. */
  feed: async (skip = 0, take = 20): Promise<Paged<OrganizationFeedItem>> => {
    const { data } = await apiClient.get<Paged<OrganizationFeedItem>>('/api/organizations/posts/feed', { params: { skip, take } });
    return data;
  },
  posts: async (id: string, skip = 0, take = 20): Promise<Paged<OrganizationPost>> => {
    const { data } = await apiClient.get<Paged<OrganizationPost>>(`/api/organizations/${id}/posts`, { params: { skip, take } });
    return data;
  },

  // ── Мои организации и заявки ──────────────────────────────────────────────
  myMemberships: async (): Promise<Membership[]> => {
    const { data } = await apiClient.get<Membership[]>('/api/organizations/mine/memberships');
    return data;
  },
  myApplications: async (): Promise<OrganizationApplication[]> => {
    const { data } = await apiClient.get<OrganizationApplication[]>('/api/organizations/mine/applications');
    return data;
  },
  apply: async (id: string, message?: string): Promise<OrganizationApplication> => {
    const { data } = await apiClient.post<OrganizationApplication>(`/api/organizations/${id}/apply`, { message: message?.trim() || null });
    return data;
  },
  withdraw: async (applicationId: string): Promise<void> => {
    await apiClient.delete(`/api/organizations/applications/${applicationId}`);
  },
  leave: async (id: string): Promise<void> => {
    await apiClient.post(`/api/organizations/${id}/leave`);
  },

  // ── Управление (администратор / организатор организации) ──────────────────
  create: async (dto: CreateOrganizationInput): Promise<OrganizationDetails> => {
    const { data } = await apiClient.post<OrganizationDetails>('/api/organizations', dto);
    return data;
  },
  update: async (id: string, dto: OrganizationInput): Promise<OrganizationDetails> => {
    const { data } = await apiClient.put<OrganizationDetails>(`/api/organizations/${id}`, dto);
    return data;
  },
  archive: async (id: string): Promise<void> => {
    await apiClient.post(`/api/organizations/${id}/archive`);
  },
  activate: async (id: string): Promise<void> => {
    await apiClient.post(`/api/organizations/${id}/activate`);
  },
  setImage: async (id: string, kind: 'logo' | 'cover', imageId: string, crop: ImageCropDto | null): Promise<OrganizationDetails> => {
    const { data } = await apiClient.put<OrganizationDetails>(`/api/organizations/${id}/${kind}`, { imageId, crop });
    return data;
  },
  /** Меняет только кадр установленного логотипа/обложки (файл заново не отправляется). */
  setImageCrop: async (id: string, kind: 'logo' | 'cover', crop: ImageCropDto): Promise<OrganizationDetails> => {
    const { data } = await apiClient.put<OrganizationDetails>(`/api/organizations/${id}/${kind}/crop`, crop);
    return data;
  },
  clearImage: async (id: string, kind: 'logo' | 'cover'): Promise<OrganizationDetails> => {
    const { data } = await apiClient.delete<OrganizationDetails>(`/api/organizations/${id}/${kind}`);
    return data;
  },
  members: async (id: string, role?: MemberRole, skip = 0, take = 50): Promise<Paged<OrganizationMember>> => {
    const { data } = await apiClient.get<Paged<OrganizationMember>>(`/api/organizations/${id}/members`, { params: { role, skip, take } });
    return data;
  },
  /** Организаторы, не назначенные ни в одну организацию (администратор). */
  unassignedOrganizers: async (skip = 0, take = 50): Promise<Paged<UnassignedOrganizer>> => {
    const { data } = await apiClient.get<Paged<UnassignedOrganizer>>('/api/organizations/unassigned-organizers', { params: { skip, take } });
    return data;
  },
  addOrganizer: async (id: string, userId: string): Promise<void> => {
    await apiClient.post(`/api/organizations/${id}/organizers`, { userId });
  },
  removeMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/api/organizations/${id}/members/${userId}`);
  },

  // ── Публикации ────────────────────────────────────────────────────────────
  createPost: async (id: string, text: string | null, eventId: string | null, images: PostImageInput[]): Promise<OrganizationPost> => {
    const { data } = await apiClient.post<OrganizationPost>(`/api/organizations/${id}/posts`, { text: text?.trim() || null, eventId, images });
    return data;
  },
  updatePost: async (postId: string, text: string | null): Promise<OrganizationPost> => {
    const { data } = await apiClient.put<OrganizationPost>(`/api/organization-posts/${postId}`, { text: text?.trim() || null });
    return data;
  },
  deletePost: async (postId: string): Promise<void> => {
    await apiClient.delete(`/api/organization-posts/${postId}`);
  },
  addPostImage: async (postId: string, image: PostImageInput): Promise<OrganizationPost> => {
    const { data } = await apiClient.post<OrganizationPost>(`/api/organization-posts/${postId}/images`, image);
    return data;
  },
  removePostImage: async (postId: string, imageId: string): Promise<OrganizationPost> => {
    const { data } = await apiClient.delete<OrganizationPost>(`/api/organization-posts/${postId}/images/${imageId}`);
    return data;
  },
  /** Прикрепляет файл к публикации (.pdf, .txt, .docx — до 10 МБ, .mp4 — до 50 МБ). */
  addPostFile: async (postId: string, file: File): Promise<OrganizationPost> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<OrganizationPost>(`/api/organization-posts/${postId}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 5 * 60 * 1000,   // видео до 50 МБ на медленном канале
    });
    return data;
  },
  removePostFile: async (postId: string, fileId: string): Promise<OrganizationPost> => {
    const { data } = await apiClient.delete<OrganizationPost>(`/api/organization-posts/${postId}/files/${fileId}`);
    return data;
  },
  setPostHidden: async (postId: string, hidden: boolean): Promise<void> => {
    await apiClient.post(`/api/organization-posts/${postId}/${hidden ? 'hide' : 'show'}`);
  },
};
