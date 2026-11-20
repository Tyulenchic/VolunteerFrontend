import type { Tone } from '../components/ui/StatusBadge';

/** Пояснения к номерам ответов, которые чаще всего встречаются в журнале. Остальные показываются только числом. */
export const STATUS_HINTS: Record<number, string> = {
  200: 'Успешно', 201: 'Создано', 202: 'Принято', 204: 'Успешно, без содержимого', 301: 'Перенаправление', 304: 'Не изменилось',
  400: 'Неверные данные', 401: 'Нужен вход или токен не подошёл', 403: 'Нет прав', 404: 'Не найдено', 409: 'Конфликт',
  413: 'Слишком большой файл', 422: 'Данные не прошли проверку', 429: 'Слишком много запросов',
  500: 'Ошибка сервера', 502: 'Сервер недоступен', 503: 'Сервис временно недоступен',
};

/** Цвет плашки по классу ответа: 2xx — хорошо, 3xx — нейтрально, 4xx — ошибка клиента, 5xx — ошибка сервера. */
export const statusTone = (status: number): Tone => {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warning';
  if (status >= 300) return 'neutral';
  return 'success';
};

/** Сколько ответов каждого класса (2, 3, 4, 5) среди посчитанных по номерам. */
export const countByClass = (statuses: Record<string, number>): Record<number, number> => {
  const result: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const [code, n] of Object.entries(statuses)) {
    const cls = Math.floor(Number(code) / 100);
    if (cls in result) result[cls] += n;
  }
  return result;
};

export const REQUEST_SORTS = [
  { value: 'time-desc', label: 'Сначала новые', sort: 'time', order: 'desc' },
  { value: 'time-asc', label: 'Сначала старые', sort: 'time', order: 'asc' },
  { value: 'status-desc', label: 'По номеру ответа: от больших к меньшим', sort: 'status', order: 'desc' },
  { value: 'status-asc', label: 'По номеру ответа: от меньших к большим', sort: 'status', order: 'asc' },
  { value: 'duration-desc', label: 'Сначала медленные', sort: 'duration', order: 'desc' },
  { value: 'path-asc', label: 'По адресу', sort: 'path', order: 'asc' },
] as const;

export type RequestSortKey = (typeof REQUEST_SORTS)[number]['value'];
