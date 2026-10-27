import { API_BASE_URL } from '../config';

/**
 * Изображения хранятся в БД бэкенда и отдаются по относительным адресам вида /api/images/{id}.
 * Сайт и API живут на разных адресах, поэтому такие адреса нужно дополнять адресом API.
 * Делается один раз в ответах API (см. client.ts), а не в каждой странице.
 */
const IMAGE_PATH = /^\/api\/(images|users\/me\/avatar|admin\/moderation\/avatars)\//;

export function absoluteImageUrl<T extends string | null | undefined>(url: T): T {
  if (typeof url === 'string' && IMAGE_PATH.test(url)) return (API_BASE_URL + url) as T;
  return url;
}

/** Рекурсивно заменяет относительные адреса изображений на абсолютные во всём ответе API. */
export function absolutizeImageUrls<T>(data: T): T {
  if (typeof data === 'string') return absoluteImageUrl(data) as unknown as T;
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) data[i] = absolutizeImageUrls(data[i]);
    return data;
  }
  if (data && typeof data === 'object' && !(data instanceof Blob) && !(data instanceof ArrayBuffer)) {
    const record = data as Record<string, unknown>;
    for (const key of Object.keys(record)) record[key] = absolutizeImageUrls(record[key]);
  }
  return data;
}

const GUID = /\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

/** Идентификатор изображения из его адреса (нужен, чтобы запросить предпросмотр черновика с токеном). */
export function imageIdFromUrl(url: string | null | undefined): string | null {
  return url ? (GUID.exec(url)?.[1] ?? null) : null;
}
