import axios from 'axios';
import { apiClient } from './client';
import { onSessionCleared } from '../auth/session';
import { downloadFile, type DossierFormat } from '../utils/downloadFile';

const API_BASE = '/api/admin/database';
const ACCESS_HEADER = 'X-Db-Access';

export type DbColumnKind = 'Value' | 'Secret' | 'Binary';
export interface DbColumnInfo { name: string; dataType: string; kind: DbColumnKind }
export interface DbTableInfo { name: string; columnCount: number }
export interface DbTablePage {
  table: string;
  columns: DbColumnInfo[];
  rows: (string | null)[][];
  total: number;
  skip: number;
  take: number;
}
export interface DbAccessChallenge { challengeId: string; maskedEmail: string; expiresAt: string }
export interface DbTableQuery { skip?: number; take?: number; search?: string; sort?: string; desc?: boolean }

/**
 * Ключ доступа к базе хранится только в памяти вкладки: не в localStorage/sessionStorage и не в cookie,
 * поэтому не переживает перезагрузку страницы и не виден другим вкладкам. Проверяет его только сервер —
 * подмена значения здесь ничего не открывает (см. API/DatabaseBrowser на бэкенде).
 */
let grant: { token: string; expiresAt: number; userId: string } | null = null;

// Выход из аккаунта (здесь или в другой вкладке) сразу забывает ключ.
onSessionCleared(() => { grant = null; });

export const dbAccess = {
  /** Время окончания действующего доступа (мс) для этого пользователя или null. */
  expiresAt(userId: string | undefined): number | null {
    if (!grant || grant.userId !== userId || grant.expiresAt <= Date.now()) return null;
    return grant.expiresAt;
  },
  clear() { grant = null; },
};

const accessHeaders = (): Record<string, string> => (grant ? { [ACCESS_HEADER]: grant.token } : {});

/** Сервер отказал из-за истёкшего или отсутствующего доступа: нужно снова ввести пароль и код. */
export function isDbAccessRequired(err: unknown): boolean {
  if (!axios.isAxiosError(err) || err.response?.status !== 403) return false;
  let data = err.response.data as unknown;
  // запрос таблицы получает ответ текстом (см. getTable) — тело ошибки тоже строка
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return false; } }
  return (data as { code?: string } | undefined)?.code === 'DbAccessRequired';
}

export const databaseApi = {
  async challenge(password: string): Promise<DbAccessChallenge> {
    const res = await apiClient.post<DbAccessChallenge>(`${API_BASE}/challenge`, { password });
    return res.data;
  },

  async verify(userId: string, challengeId: string, code: string): Promise<void> {
    const res = await apiClient.post<{ accessToken: string; expiresAt: string }>(`${API_BASE}/verify`, { challengeId, code });
    grant = { token: res.data.accessToken, expiresAt: new Date(res.data.expiresAt).getTime(), userId };
  },

  async endSession(): Promise<void> {
    grant = null;
    await apiClient.delete(`${API_BASE}/session`).catch(() => { /* ключ всё равно истечёт сам */ });
  },

  async getTables(): Promise<DbTableInfo[]> {
    const res = await apiClient.get<DbTableInfo[]>(`${API_BASE}/tables`, { headers: accessHeaders() });
    return res.data;
  },

  async getTable(table: string, q: DbTableQuery): Promise<DbTablePage> {
    // Ответ разбирается вручную: общий перехватчик дописывает адрес API к строкам вида /api/images/…,
    // а здесь значения ячеек должны остаться такими, как в базе.
    const res = await apiClient.get<string>(`${API_BASE}/tables/${encodeURIComponent(table)}`, {
      params: { skip: q.skip, take: q.take, search: q.search || undefined, sort: q.sort || undefined, desc: q.desc || undefined },
      headers: accessHeaders(),
      responseType: 'text',
      transformResponse: [d => d],
    });
    return JSON.parse(res.data) as DbTablePage;
  },

  exportTable(table: string, format: DossierFormat, q: Pick<DbTableQuery, 'search' | 'sort' | 'desc'>): Promise<void> {
    const params: Record<string, string> = { format };
    if (q.search) params.search = q.search;
    if (q.sort) params.sort = q.sort;
    if (q.desc) params.desc = 'true';
    return downloadFile(`${API_BASE}/tables/${encodeURIComponent(table)}/export`, params, `${table}.${format}`, accessHeaders());
  },
};
