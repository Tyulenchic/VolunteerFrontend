// Единственный источник базового URL API. Значение берётся из VITE_API_URL на этапе сборки
// (публичный URL, не секрет). Пустое значение означает «API на том же адресе, что и сайт»: запросы идут на тот же origin
// (в dev — через прокси Vite, см. vite.config.ts, в production — когда сайт и API лежат на одном домене).
// Забытая переменная (её нет в окружении сборки совсем) в production — ошибка, чтобы не выложить сайт с неверным адресом.
const configured = import.meta.env.VITE_API_URL as string | undefined;

if (configured === undefined && import.meta.env.PROD) {
  throw new Error('VITE_API_URL не задан: укажите публичный URL API при сборке (например, https://api.example.org) или пустое значение, если API на том же домене.');
}

const raw = (configured ?? '').trim();

export const API_BASE_URL = raw.replace(/\/+$/, '');

/** Таймаут всех запросов к API (в т.ч. refresh): зависший запрос превращается в понятную ошибку соединения. */
export const API_TIMEOUT_MS = 20_000;

/**
 * Ящик, с которого администратор отвечает на обращения «Написать нам» (кнопка «Ответить в Gmail» открывает
 * окно письма Gmail с этим аккаунтом). Задаётся VITE_REPLY_FROM_EMAIL; пока не задан — письмо открывается в аккаунте Gmail, в котором администратор уже вошёл.
 */
export const REPLY_FROM_EMAIL = (import.meta.env.VITE_REPLY_FROM_EMAIL ?? '').trim();
