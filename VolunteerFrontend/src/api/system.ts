import { apiClient } from './client';

const API_BASE = '/api/admin/system';

export interface SystemStatusDto {
  checkedAt: string;
  /** Что нужно сделать прямо сейчас, человеческим языком. Пусто — всё в порядке. */
  advice: string[];
  tasks: { state: 'ok' | 'stale' | 'never'; lastRunAt: string | null; minutesSinceLastRun: number | null };
  mail: {
    byStatus: Record<string, number>;
    waiting: number;
    failed: number;
    oldestWaitingMinutes: number | null;
    recentFailures: { recipient: string; subject: string; lastError: string | null; updatedAt: string }[];
  };
  php: {
    version: string; sapi: string; opcache: boolean;
    memoryLimitMb: number | null; uploadMaxFilesizeMb: number | null; postMaxSizeMb: number | null; maxExecutionTime: number;
  };
  database: {
    version: string; sizeMb: number; maxAllowedPacketMb: number | null;
    largestTables: { name: string; sizeMb: number; rows: number }[];
  };
  disk: { freeMb: number | null };
  load: { publicCacheSeconds: number; floodLimitPerMinute: number };
  log: {
    errorsToday: number;
    slowRequestsToday: number;
    recentErrors: { at: string; level: string; message: string; traceId: string | null }[];
  };
}

export interface UserEmailDto {
  id: string;
  subject: string;
  type: string;
  status: 'Pending' | 'Sending' | 'Retrying' | 'Sent' | 'Failed';
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** Одна запись журнала запросов: что запросили, каким номером ответил сервер и сколько это заняло. */
export interface RequestLogEntryDto {
  id: number;
  createdAt: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId: string | null;
  ip: string | null;
}

export interface RequestLogParams {
  skip?: number;
  take?: number;
  /** Точный номер ответа: 200, 404, 500… */
  status?: number;
  /** Класс ответа: 2, 3, 4 или 5. */
  statusClass?: number;
  method?: string;
  /** Часть адреса. */
  path?: string;
  userId?: string;
  /** Даты ГГГГ-ММ-ДД, обе включительно. */
  from?: string;
  to?: string;
  slowerThanMs?: number;
  sort?: 'time' | 'status' | 'duration' | 'path';
  order?: 'asc' | 'desc';
}

export interface RequestLogPage {
  items: RequestLogEntryDto[];
  total: number;
  /** Сколько записей каждого номера при тех же фильтрах, кроме номера (для кнопок над таблицей). */
  statuses: Record<string, number>;
}

export const systemApi = {
  /** Журнал запросов к API с номерами ответов; только системному администратору. */
  async getRequests(params: RequestLogParams): Promise<RequestLogPage> {
    const res = await apiClient.get<RequestLogPage>(`${API_BASE}/requests`, { params });
    return res.data;
  },

  async getStatus(): Promise<SystemStatusDto> {
    const res = await apiClient.get<SystemStatusDto>(`${API_BASE}/status`);
    return res.data;
  },

  /** Возвращает в очередь уведомления, которые не удалось отправить. Письма с одноразовыми ссылками не возвращаются. */
  async retryFailedEmails(): Promise<number> {
    const res = await apiClient.post<{ requeued: number }>(`${API_BASE}/emails/retry-failed`);
    return res.data.requeued;
  },

  /** Запускает фоновые задачи сейчас: отправка очереди писем, завершение прошедших мероприятий. */
  async runTasks(): Promise<{ ran: boolean; emails: number }> {
    const res = await apiClient.post<{ ran: boolean; emails: number }>(`${API_BASE}/tasks/run`);
    return res.data;
  },

  /** Что сайт отправлял пользователю и дошло ли. */
  async getUserEmails(userId: string): Promise<UserEmailDto[]> {
    const res = await apiClient.get<UserEmailDto[]>(`/api/admin/users/${userId}/emails`);
    return res.data;
  },

  /** Подтвердить адрес вручную по обращению; основание пишется в журнал. */
  async confirmUserEmail(userId: string, reason: string): Promise<void> {
    await apiClient.post(`/api/admin/users/${userId}/confirm-email`, { reason });
  },

  async resendConfirmation(userId: string): Promise<void> {
    await apiClient.post(`/api/admin/users/${userId}/resend-confirmation`);
  },
};
