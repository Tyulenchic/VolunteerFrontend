import { apiClient } from './client';
import type {
  ApplicationStatus, OrganizationApplication, OrganizerNotification, OrganizerParticipation,
  OrganizerParticipationStatus, OrganizerSummary, Paged,
} from '../types/organization';

/** Кабинет организатора: заявки волонтёров, заявки на мероприятия организации и уведомления. */
export const organizerApi = {
  summary: async (): Promise<OrganizerSummary> => {
    const { data } = await apiClient.get<OrganizerSummary>('/api/organizer/summary');
    return data;
  },

  // ── Заявки на вступление в организацию ────────────────────────────────────
  applications: async (
    params: { organizationId?: string; status?: ApplicationStatus; skip?: number; take?: number } = {},
  ): Promise<Paged<OrganizationApplication>> => {
    const { data } = await apiClient.get<Paged<OrganizationApplication>>('/api/organizer/membership-applications', { params });
    return data;
  },
  approveApplication: async (id: string, note?: string): Promise<OrganizationApplication> => {
    const { data } = await apiClient.post<OrganizationApplication>(`/api/organizer/membership-applications/${id}/approve`, { note: note?.trim() || null });
    return data;
  },
  rejectApplication: async (id: string, note?: string): Promise<OrganizationApplication> => {
    const { data } = await apiClient.post<OrganizationApplication>(`/api/organizer/membership-applications/${id}/reject`, { note: note?.trim() || null });
    return data;
  },

  // ── Заявки на мероприятия организации ─────────────────────────────────────
  participations: async (
    params: { status?: OrganizerParticipationStatus; eventId?: string; organizationId?: string; skip?: number; take?: number } = {},
  ): Promise<Paged<OrganizerParticipation>> => {
    const { data } = await apiClient.get<Paged<OrganizerParticipation>>('/api/organizer/participations', { params });
    return data;
  },
  approveParticipation: async (id: string, comment?: string): Promise<void> => {
    await apiClient.post(`/api/organizer/participations/${id}/approve`, { comment: comment?.trim() || null });
  },
  rejectParticipation: async (id: string, comment?: string): Promise<void> => {
    await apiClient.post(`/api/organizer/participations/${id}/reject`, { comment: comment?.trim() || null });
  },
  confirmAttendance: async (id: string, comment?: string): Promise<void> => {
    await apiClient.post(`/api/organizer/participations/${id}/confirm-attendance`, { comment: comment?.trim() || null });
  },

  // ── Уведомления ───────────────────────────────────────────────────────────
  notifications: async (skip = 0, take = 20, isRead?: boolean): Promise<{ items: OrganizerNotification[]; total: number }> => {
    const { data } = await apiClient.get<{ items: OrganizerNotification[]; total: number }>('/api/organizer/notifications', { params: { skip, take, isRead } });
    return data;
  },
  unreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ count: number }>('/api/organizer/notifications/unread-count');
    return data.count;
  },
  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/api/organizer/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await apiClient.post('/api/organizer/notifications/read-all');
  },
};
