import axios from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "../config";

/**
 * Единственный источник правды о токенах и об операции refresh.
 * Никакой другой код не должен читать/писать токены в localStorage напрямую.
 *
 * Политика бэкенда: access — 15 минут; refresh — жёсткие 6 месяцев с ротацией (использованный токен
 * становится недействительным); любой отказ refresh — 401 (400 — невалидное тело).
 */

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

/** ok — получена новая пара; invalid — refresh-сессия недействительна (сессия очищена);
 *  unavailable — временный сбой (429 / 5xx / сеть): токены сохраняются, выходить нельзя. */
export type RefreshResult = "ok" | "invalid" | "unavailable";

// ─── Хранилище ────────────────────────────────────────────────────────────────

function read(key: string): string | null {
  try { return localStorage.getItem(key) || null; } catch { return null; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* хранилище недоступно */ }
}
function remove(key: string) {
  try { localStorage.removeItem(key); } catch { /* хранилище недоступно */ }
}

export const getAccessToken = () => read(ACCESS_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);
/** Есть ли хоть какая-то сессия (access ИЛИ refresh). Отсутствие access ещё не значит, что сессии нет. */
export const hasSession = () => !!(getAccessToken() || getRefreshToken());

export function setTokens(accessToken: string, refreshToken: string) {
  write(ACCESS_KEY, accessToken);
  write(REFRESH_KEY, refreshToken);
}

// ─── Уведомления об очистке сессии ────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

/** Подписка на «сессия очищена» (refresh отклонён, logout, выход в другой вкладке). */
export function onSessionCleared(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function notifyCleared() {
  listeners.forEach(l => l());
}

// Увеличивается при каждой очистке: refresh, начатый до logout, не должен «воскресить» сессию.
let epoch = 0;

export function clearSession() {
  epoch++;
  remove(ACCESS_KEY);
  remove(REFRESH_KEY);
  notifyCleared();
}

if (typeof window !== "undefined") {
  // Выход (или отказ refresh) в другой вкладке.
  window.addEventListener("storage", (e) => {
    if (e.key === null || (e.key === REFRESH_KEY && e.newValue === null)) notifyCleared();
  });
}

// ─── Single-flight refresh ────────────────────────────────────────────────────

/** Клиент БЕЗ перехватчиков: refresh не может зациклиться и не зависит от access-токена. */
export const refreshHttp = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

let inflight: Promise<RefreshResult> | null = null;

/**
 * Одна общая операция refresh: все параллельные вызовы получают один и тот же Promise.
 * @param staleAccessToken access-токен, с которым запрос получил 401. Если текущий токен уже другой
 *   (его обновила эта или другая вкладка), refresh не нужен — достаточно повторить запрос.
 */
export function refreshSession(staleAccessToken?: string): Promise<RefreshResult> {
  if (!inflight) {
    inflight = withCrossTabLock(() => runRefresh(staleAccessToken)).finally(() => { inflight = null; });
  }
  return inflight;
}

/** Web Locks (если есть) сериализуют refresh между вкладками: ротация не терпит двух refresh одним токеном. */
function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? locks.request("volunteer-auth-refresh", fn) : fn();
}

async function runRefresh(staleAccessToken?: string): Promise<RefreshResult> {
  const current = getAccessToken();
  if (staleAccessToken && current && current !== staleAccessToken) return "ok"; // уже обновлён

  const refreshToken = getRefreshToken();
  if (!refreshToken) return "invalid";

  const startedAt = epoch;
  try {
    const { data } = await refreshHttp.post<{ accessToken?: string; refreshToken?: string }>(
      "/api/auth/refresh", { refreshToken });
    if (typeof data?.accessToken !== "string" || typeof data?.refreshToken !== "string") return "unavailable";
    if (epoch !== startedAt) return "invalid"; // за время запроса был logout/очистка
    setTokens(data.accessToken, data.refreshToken);
    return "ok";
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    if (status === 401 || status === 400) {
      // Сервер однозначно отверг refresh-токен (истёк / отозван / использован / пользователь заблокирован).
      if (epoch === startedAt) clearSession();
      return "invalid";
    }
    // 429, 5xx, сеть, CORS: сессию не трогаем.
    return "unavailable";
  }
}

// ─── Маркер временного сбоя ───────────────────────────────────────────────────

const UNAVAILABLE = "sessionRefreshUnavailable";

/** Помечает ошибку исходного запроса: 401 получен, но обновить токен сейчас не удалось (временно). */
export function markRefreshUnavailable(err: unknown) {
  if (err && typeof err === "object") (err as Record<string, unknown>)[UNAVAILABLE] = true;
}
export function isRefreshUnavailable(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as Record<string, unknown>)[UNAVAILABLE] === true;
}
