import { apiClient } from './client';
import type {
  AdminDashboardDto,
  AdminStatsDto,
  AdminUserListItemDto,
  AdminUserDetailDto,
  AdminParticipationDto,
  AdminEventListDto,
  AdminEventStatisticsDto,
  AdminNewsListDto,
  AdminAnalyticsDto,
  UnreadNotificationsResponseDto,
  AdminNotificationDto,
} from '../types/admin';
import type { AuditLogEntryDto } from '../types/audit';
import type { EventResponseDto } from '../types/event';
import type { NewsResponseDto } from './news';

const API_BASE = '/api/admin';

export const adminApi = {
  // ==================== DASHBOARD & STATS ====================

  async getDashboard() {
    const res = await apiClient.get<AdminDashboardDto>(`${API_BASE}/dashboard`);
    return res.data;
  },

  async getStats() {
    const res = await apiClient.get<AdminStatsDto>(`${API_BASE}/stats`);
    return res.data;
  },

  // ==================== USERS ====================

  async getUsers(skip = 0, take = 20, search?: string, role?: string, isActive?: boolean) {
    const res = await apiClient.get<{ items: AdminUserListItemDto[]; total: number }>(
        `${API_BASE}/users`,
        { params: { skip, take, search, role, isActive } }
    );
    return { Items: res.data.items, Total: res.data.total };
  },

  async getUserDetail(userId: string) {
    const res = await apiClient.get<AdminUserDetailDto>(`${API_BASE}/users/${userId}`);
    return res.data;
  },

  async blockUser(userId: string, reason: string) {
    await apiClient.post(`${API_BASE}/users/${userId}/block`, { reason });
  },

  async unblockUser(userId: string, reason?: string) {
    await apiClient.post(`${API_BASE}/users/${userId}/unblock`, { reason });
  },

  async changeUserRole(userId: string, newRole: 'Volunteer' | 'Organizer' | 'Admin') {
    await apiClient.post(`${API_BASE}/users/${userId}/change-role`, { newRole });
  },

  async deleteUser(userId: string) {
    await apiClient.delete(`${API_BASE}/users/${userId}`);
  },

  // ==================== NEWS ====================

  async getNews(skip = 0, take = 20, search?: string, status?: string) {
    const res = await apiClient.get<{ items: AdminNewsListDto[]; total: number }>(
        `${API_BASE}/news`,
        { params: { skip, take, search, status } }
    );
    return { Items: res.data.items, Total: res.data.total };
  },

  async createNews(data: any) {
    const res = await apiClient.post<AdminNewsListDto>(`/api/news`, data);
    return res.data;
  },

  async updateNews(newsId: string, data: any) {
    const res = await apiClient.put<AdminNewsListDto>(`/api/news/${newsId}`, data);
    return res.data;
  },

  async deleteNews(newsId: string) {
    await apiClient.delete(`/api/news/${newsId}`);
  },

  async uploadNewsImage(newsId: string, file: File): Promise<NewsResponseDto> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<NewsResponseDto>(`/api/news/${newsId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async publishNews(newsId: string) {
    await apiClient.post(`${API_BASE}/news/${newsId}/publish`);
  },

  async unpublishNews(newsId: string) {
    await apiClient.post(`${API_BASE}/news/${newsId}/unpublish`);
  },

  async archiveNews(newsId: string) {
    await apiClient.post(`${API_BASE}/news/${newsId}/archive`);
  },

  async restoreNews(newsId: string) {
    await apiClient.post(`${API_BASE}/news/${newsId}/restore`);
  },

  // ==================== EVENTS ====================

  async getEvents(skip = 0, take = 20, search?: string, status?: string) {
    const res = await apiClient.get<{ items: AdminEventListDto[]; total: number }>(
        `${API_BASE}/events`,
        { params: { skip, take, search, status } }
    );
    return { Items: res.data.items, Total: res.data.total };
  },

  async getEventStatistics(eventId: string) {
    const res = await apiClient.get<AdminEventStatisticsDto>(`/api/events/${eventId}/statistics`);
    return res.data;
  },

  async createEvent(data: any) {
    const res = await apiClient.post<AdminEventListDto>(`/api/events`, data);
    return res.data;
  },

  async updateEvent(eventId: string, data: any) {
    const res = await apiClient.put<AdminEventListDto>(`/api/events/${eventId}`, data);
    return res.data;
  },

  async deleteEvent(eventId: string) {
    await apiClient.delete(`/api/events/${eventId}`);
  },

  async uploadEventImage(eventId: string, file: File): Promise<EventResponseDto> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<EventResponseDto>(`/api/events/${eventId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async deleteEventImage(eventId: string) {
    await apiClient.delete(`/api/events/${eventId}/image`);
  },

  async publishEvent(eventId: string) {
    await apiClient.post(`/api/events/${eventId}/publish`);
  },

  async unpublishEvent(eventId: string) {
    await apiClient.post(`/api/events/${eventId}/unpublish`);
  },

  async cancelEvent(eventId: string, reason?: string) {
    await apiClient.post(`/api/events/${eventId}/cancel`, { reason });
  },

  async completeEvent(eventId: string) {
    await apiClient.post(`/api/events/${eventId}/complete`);
  },

  async updateEventMaxParticipants(eventId: string, maxParticipants: number) {
    await apiClient.patch(`/api/events/${eventId}/max-participants`, { maxParticipants });
  },

  // ==================== PARTICIPATIONS ====================

  async getParticipations(
      skip = 0,
      take = 20,
      search?: string,
      status?: string,
      eventId?: string
  ) {
    const res = await apiClient.get<{ items: AdminParticipationDto[]; total: number }>(
        `${API_BASE}/participations`,
        { params: { skip, take, search, status, eventId } }
    );
    return { Items: res.data.items, Total: res.data.total };
  },

  async approveParticipation(participationId: string, comment?: string) {
    await apiClient.post(`${API_BASE}/participations/${participationId}/approve`, { comment });
  },

  async rejectParticipation(participationId: string, comment?: string) {
    await apiClient.post(`${API_BASE}/participations/${participationId}/reject`, { comment });
  },

  async bulkApproveParticipations(participationIds: string[], comment?: string) {
    const res = await apiClient.post<{ approvedCount: number }>(
        `${API_BASE}/participations/bulk-approve`,
        { participationIds, comment }
    );
    return { ApprovedCount: res.data.approvedCount };
  },

  async bulkRejectParticipations(participationIds: string[], comment?: string) {
    const res = await apiClient.post<{ rejectedCount: number }>(
        `${API_BASE}/participations/bulk-reject`,
        { participationIds, comment }
    );
    return { RejectedCount: res.data.rejectedCount };
  },

  // ==================== AUDIT LOG ====================

  async getAuditLog(skip = 0, take = 20, adminUserId?: string, actionType?: string) {
    const res = await apiClient.get<{ items: AuditLogEntryDto[]; total: number }>(
        `${API_BASE}/audit-log`,
        { params: { skip, take, adminUserId, actionType } }
    );
    return { Items: res.data.items, Total: res.data.total };
  },

  // ==================== ANALYTICS ====================

  async getAnalytics(monthsBack = 12) {
    const res = await apiClient.get<AdminAnalyticsDto>(`${API_BASE}/analytics`, {
      params: { monthsBack },
    });
    return res.data;
  },

  // ==================== NOTIFICATIONS ====================

  async getNotifications(skip = 0, take = 20, isRead?: boolean) {
    const res = await apiClient.get<{ items: AdminNotificationDto[]; total: number }>(
        `${API_BASE}/notifications`,
        { params: { skip, take, isRead } }
    );
    return { Items: res.data.items, Total: res.data.total };
  },

  async getUnreadNotifications() {
    const res = await apiClient.get<UnreadNotificationsResponseDto>(
        `${API_BASE}/notifications/unread`
    );
    return res.data;
  },

  async markNotificationAsRead(notificationId: string) {
    await apiClient.post(`${API_BASE}/notifications/${notificationId}/read`);
  },

  async markAllNotificationsAsRead() {
    await apiClient.post(`${API_BASE}/notifications/mark-all-read`);
  },
};