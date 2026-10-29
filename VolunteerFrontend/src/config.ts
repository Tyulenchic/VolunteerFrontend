// Единственный источник базового URL API. Значение берётся из VITE_API_URL на этапе сборки
// (публичный URL, не секрет). В dev допускается пустое значение — тогда запросы идут на тот же origin
// (прокси Vite, см. vite.config.ts); в production сборке значение обязательно.
const raw = (import.meta.env.VITE_API_URL ?? '').trim();

if (!raw && import.meta.env.PROD) {
  throw new Error('VITE_API_URL не задан: укажите публичный URL API при сборке (например, https://api.example.org).');
}

export const API_BASE_URL = raw.replace(/\/+$/, '');

/** Таймаут всех запросов к API (в т.ч. refresh): зависший запрос превращается в понятную ошибку соединения. */
export const API_TIMEOUT_MS = 20_000;

/**
 * Ящик, с которого администратор отвечает на обращения «Написать нам» (кнопка «Ответить в Gmail» открывает
 * окно письма Gmail с этим аккаунтом). Задаётся VITE_REPLY_FROM_EMAIL; пока не задан — временная заглушка.
 */
export const REPLY_FROM_EMAIL = (import.meta.env.VITE_REPLY_FROM_EMAIL ?? '').trim() || 'aenvirel@gmail.com';
