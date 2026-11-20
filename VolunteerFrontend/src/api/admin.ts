import { apiClient } from './client';
import type {
  AdminDashboardDto,
  AdminStatsDto,
  AdminUserListItemDto,
  AdminUserDetailDto,
  AdminParticipationDto,
  AdminEventListDto,
  AdminNewsListDto,
  AdminAnalyticsDto,
  UnreadNotificationsResponseDto,
  AdminNotificationDto,
  AdminEventStatisticsDto,
  UserDossierDto,
} from '../types/admin';
import type { AuditLogEntryDto } from '../types/audit';
import type { EventResponseDto } from '../types/event';
import type { NewsResponseDto } from './news';
import type { ImageCropDto } from '../types/organization';
import { appendCrop } from './images';
import { downloadFile, type DossierFormat } from '../utils/downloadFile';

const API_BASE = '/api/admin';

export interface ParticipationActionDto {
  comment?: string | null;
}

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

  async getUsers(skip = 0, take = 20, search?: string, role?: string, isActive?: boolean, emailConfirmed?: boolean, sort?: string, order?: 'asc' | 'desc') {
    const res = await apiClient.get<{ items: AdminUserListItemDto[]; total: number }>(
        `${API_BASE}/users`,
        { params: { skip, take, search, role, isActive, emailConfirmed, sort, order } }
    );
    return { Items: res.data.items, Total: res.data.total };
  },

  async getUserDetail(userId: string) {
    const res = await apiClient.get<AdminUserDetailDto>(`${API_BASE}/users/${userId}`);
    return res.data;
  },

  /** Досье одним ответом; просмотр записывается в журнал действий. */
  async getUserDossier(userId: string): Promise<UserDossierDto> {
    const res = await apiClient.get<UserDossierDto>(`${API_BASE}/users/${userId}/dossier`);
    return res.data;
  },

  /** Только системный администратор. null — снять ограничения (системный администратор), список — администратор контента. */
  async setAdminSections(userId: string, sections: string[] | null): Promise<{ adminSections: string[] | null }> {
    const { data } = await apiClient.put<{ adminSections: string[] | null }>(`${API_BASE}/users/${userId}/admin-sections`, { sections });
    return data;
  },

  /** Причина необязательна: пользователь получает стандартный текст, а если причина есть — она добавляется к нему. */
  async blockUser(userId: string, reason?: string) {
    const text = reason?.trim();
    await apiClient.post(`${API_BASE}/users/${userId}/block`, text ? { reason: text } : {});
  },

  async unblockUser(userId: string, reason?: string) {
    await apiClient.post(`${API_BASE}/users/${userId}/unblock`, { reason });
  },

  async changeUserRole(userId: string, newRole: 'Volunteer' | 'Organizer' | 'Admin') {
    await apiClient.post(`${API_BASE}/users/${userId}/change-role`, { newRole });
  },

  /** Ссылка сброса пароля уходит на почту аккаунта; основание обращения пишется в журнал. */
  async sendPasswordReset(userId: string, reason: string) {
    await apiClient.post(`${API_BASE}/users/${userId}/send-password-reset`, { reason });
  },

  /** Смена почты по обращению: входы завершаются, новый адрес нужно подтвердить. */
  async changeUserEmail(userId: string, newEmail: string, reason: string) {
    await apiClient.post(`${API_BASE}/users/${userId}/change-email`, { newEmail, reason });
  },

  /** Скачать досье пользователя файлом (Excel / PDF / Word); выгрузка фиксируется в журнале аудита. */
  exportUserDossier(userId: string, format: DossierFormat): Promise<void> {
    return downloadFile(`${API_BASE}/users/${userId}/dossier/export`, { format }, `dossier-${userId}.${format}`);
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

  async uploadNewsImage(newsId: string, file: File, crop?: ImageCropDto | null): Promise<NewsResponseDto> {
    const form = new FormData();
    form.append('file', file);
    appendCrop(form, crop);
    const res = await apiClient.post<NewsResponseDto>(`/api/news/${newsId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async publishNews(newsId: string) {
    await apiClient.post(`${API_BASE}/news/${newsId}/publish`);
  },

  /** Опубликовать черновик новости в указанное время (ISO); публикует фоновая задача сервера. */
  async scheduleNews(newsId: string, publishAt: string) {
    await apiClient.put(`${API_BASE}/news/${newsId}/schedule`, { publishAt });
  },

  async unscheduleNews(newsId: string) {
    await apiClient.delete(`${API_BASE}/news/${newsId}/schedule`);
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

  async getEvents(skip = 0, take = 20, search?: string, status?: string, sort?: string, order?: 'asc' | 'desc') {
    const res = await apiClient.get<{ items: AdminEventListDto[]; total: number }>(
        `${API_BASE}/events`,
        { params: { skip, take, search, status, sort, order } }
    );
    return { Items: res.data.items, Total: res.data.total };
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

  async uploadEventImage(eventId: string, file: File, crop?: ImageCropDto | null): Promise<EventResponseDto> {
    const form = new FormData();
    form.append('file', file);
    appendCrop(form, crop);
    const res = await apiClient.post<EventResponseDto>(`/api/events/${eventId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /** Меняет только кадр уже загруженного фото (файл заново не отправляется). */
  async setEventImageCrop(eventId: string, crop: ImageCropDto): Promise<EventResponseDto> {
    const res = await apiClient.put<EventResponseDto>(`/api/events/${eventId}/image/crop`, crop);
    return res.data;
  },

  async setNewsImageCrop(newsId: string, crop: ImageCropDto): Promise<NewsResponseDto> {
    const res = await apiClient.put<NewsResponseDto>(`/api/news/${newsId}/image/crop`, crop);
    return res.data;
  },

  /** Сбросить кадр: фото показывается целиком. */
  async resetEventImageCrop(eventId: string): Promise<EventResponseDto> {
    const res = await apiClient.delete<EventResponseDto>(`/api/events/${eventId}/image/crop`);
    return res.data;
  },

  async resetNewsImageCrop(newsId: string): Promise<NewsResponseDto> {
    const res = await apiClient.delete<NewsResponseDto>(`/api/news/${newsId}/image/crop`);
    return res.data;
  },

  async deleteNewsImage(newsId: string) {
    await apiClient.delete(`/api/news/${newsId}/image`);
  },

  async deleteEventImage(eventId: string) {
    await apiClient.delete(`/api/events/${eventId}/image`);
  },

  async getEventStatistics(eventId: string): Promise<AdminEventStatisticsDto> {
    const res = await apiClient.get<AdminEventStatisticsDto>(`${API_BASE}/events/${eventId}/statistics`);
    return res.data;
  },

  async publishEvent(eventId: string) {
    await apiClient.post(`/api/events/${eventId}/publish`);
  },

  /** Опубликовать черновик мероприятия в указанное время (ISO); публикует фоновая задача сервера. */
  async scheduleEvent(eventId: string, publishAt: string) {
    await apiClient.put(`/api/events/${eventId}/schedule`, { publishAt });
  },

  async unscheduleEvent(eventId: string) {
    await apiClient.delete(`/api/events/${eventId}/schedule`);
  },

  async cancelEvent(eventId: string, reason?: string) {
    await apiClient.post(`/api/events/${eventId}/cancel`, { reason });
  },

  async completeEvent(eventId: string) {
    await apiClient.post(`/api/events/${eventId}/complete`);
  },

  /** Завершённое мероприятие — в архив: запись остаётся, посетителям не показывается. */
  async archiveEvent(eventId: string) {
    await apiClient.post(`/api/events/${eventId}/archive`);
  },

  // ==================== PARTICIPATIONS ====================

  async getParticipations(
      skip = 0,
      take = 20,
      search?: string,
      status?: string,
      eventId?: string,
      sort?: string,
      order?: 'asc' | 'desc'
  ) {
    const res = await apiClient.get<{ items: AdminParticipationDto[]; total: number }>(
        `${API_BASE}/participations`,
        { params: { skip, take, search, status, eventId, sort, order } }
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

  async confirmAttendance(participationId: string, comment?: string) {
    const res = await apiClient.post(
        `${API_BASE}/participations/${participationId}/confirm-attendance`,
        { comment }
    );
    return res.data;
  },

  async returnToPending(participationId: string, comment?: string) {
    const res = await apiClient.post(
        `${API_BASE}/participations/${participationId}/return-to-pending`,
        { comment }
    );
    return res.data;
  },

  async rejectApproved(participationId: string, comment?: string) {
    const res = await apiClient.post(
        `${API_BASE}/participations/${participationId}/reject-approved`,
        { comment }
    );
    return res.data;
  },

  async revokeAttendance(participationId: string, comment?: string) {
    const res = await apiClient.post(
        `${API_BASE}/participations/${participationId}/revoke-attendance`,
        { comment }
    );
    return res.data;
  },

  async addComment(participationId: string, comment: string) {
    const res = await apiClient.post(
        `${API_BASE}/participations/${participationId}/comment`,
        { comment }
    );

    return res.data;
  },

  async updateComment(participationId: string, comment: string) {
    const res = await apiClient.put(
        `${API_BASE}/participations/${participationId}/comment`,
        { comment }
    );

    return res.data;
  },

  async deleteComment(participationId: string) {
    const res = await apiClient.delete(
        `${API_BASE}/participations/${participationId}/comment`
    );

    return res.data;
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

  /** Лёгкий запрос для значка на колокольчике: только число непрочитанных. */
  async getUnreadNotificationCount(): Promise<number> {
    const res = await apiClient.get<{ unreadCount: number }>(`${API_BASE}/notifications/unread-count`);
    return res.data.unreadCount;
  },

  async markNotificationAsRead(notificationId: string) {
    await apiClient.post(`${API_BASE}/notifications/${notificationId}/read`);
  },

  async markAllNotificationsAsRead() {
    await apiClient.post(`${API_BASE}/notifications/mark-all-read`);
  },
  async addParticipationComment(participationId: string, comment: string) {
    const res = await apiClient.post(
        `${API_BASE}/participations/${participationId}/comment`,
        { comment } as ParticipationActionDto
    );
    return res.data;
  },

  async updateParticipationComment(participationId: string, comment: string) {
    const res = await apiClient.put(
        `${API_BASE}/participations/${participationId}/comment`,
        { comment } as ParticipationActionDto
    );
    return res.data;
  },

  async deleteParticipationComment(participationId: string) {
    const res = await apiClient.delete(
        `${API_BASE}/participations/${participationId}/comment`
    );
    return res.data;
  },
};
