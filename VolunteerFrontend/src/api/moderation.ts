import { apiClient } from './client';

export interface PendingAvatar {
  userId: string;
  displayName: string;
  uploadedAt: string;
  status: string;
  /** Адрес изображения для проверки: не публичный, загружается запросом с токеном. */
  previewUrl: string;
}

export interface PendingAvatarPage { items: PendingAvatar[]; totalCount: number; }

export const moderationApi = {
  pendingAvatars: async (skip = 0, take = 20): Promise<PendingAvatarPage> =>
    (await apiClient.get<PendingAvatarPage>('/api/admin/moderation/avatars/pending', { params: { skip, take } })).data,

  approveAvatar: async (userId: string): Promise<void> => {
    await apiClient.post(`/api/admin/moderation/avatars/${userId}/approve`);
  },

  /** Изображение удаляется, пользователь получает письмо с причиной. */
  rejectAvatar: async (userId: string, reason: string): Promise<void> => {
    await apiClient.post(`/api/admin/moderation/avatars/${userId}/reject`, { reason });
  },
};

export type ReportReason = 'InappropriateName' | 'InappropriateAvatar' | 'InappropriateBio' | 'Impersonation' | 'Other';
export type ReportStatus = 'Open' | 'Resolved' | 'Dismissed';
export type ReportResolution = 'Dismiss' | 'ResetProfileText' | 'RemoveAvatar' | 'BlockUser';
export type TermMatchMode = 'WholeWord' | 'Substring';

export interface ContentReport {
  id: string;
  reporterUserId: string;
  targetUserId: string;
  targetDisplayName: string;
  reason: ReportReason;
  comment: string | null;
  status: ReportStatus;
  resolution: ReportResolution | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ContentReportPage { items: ContentReport[]; totalCount: number; skip: number; take: number; }

export interface BlockedTerm { id: string; term: string; mode: TermMatchMode; createdAt: string; }

/** Длина комментария к жалобе и заметки модератора. */
export const REPORT_TEXT_MAX = 500;
export const BLOCKED_TERM_MAX = 100;

export const reportsApi = {
  /** Открытые жалобы идут первыми. */
  list: async (status: ReportStatus | null, skip = 0, take = 20): Promise<ContentReportPage> =>
    (await apiClient.get<ContentReportPage>('/api/admin/moderation/reports', { params: { status: status ?? undefined, skip, take } })).data,

  /** Мера выполняется до закрытия жалобы: если она неприменима, жалоба остаётся открытой. */
  resolve: async (reportId: string, resolution: ReportResolution, note: string | null): Promise<void> => {
    await apiClient.post(`/api/admin/moderation/reports/${reportId}/resolve`, { resolution, note });
  },

  /** Жалоба на чужой профиль. Не более 10 в сутки; повторная открытая жалоба на того же человека не принимается. */
  reportUser: async (userId: string, reason: ReportReason, comment: string | null): Promise<void> => {
    await apiClient.post(`/api/users/${userId}/report`, { reason, comment });
  },
};

export const blockedTermsApi = {
  list: async (): Promise<BlockedTerm[]> =>
    (await apiClient.get<BlockedTerm[]>('/api/admin/moderation/blocked-terms')).data,

  /** Сервер хранит выражение в нормализованном виде (регистр, похожие буквы, повторы). */
  add: async (term: string, mode: TermMatchMode): Promise<BlockedTerm> =>
    (await apiClient.post<BlockedTerm>('/api/admin/moderation/blocked-terms', { term, mode })).data,

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/moderation/blocked-terms/${id}`);
  },
};
