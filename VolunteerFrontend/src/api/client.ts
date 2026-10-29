import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "../config";
import { absolutizeImageUrls } from "../utils/imageUrl";
import { accessTokenExpiresSoon, getAccessToken, getRefreshToken, markRefreshUnavailable, refreshSession } from "../auth/session";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// 401 на этих эндпоинтах — их собственный результат (неверный пароль, неверный токен и т.п.), а не повод для refresh.
const NO_REFRESH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/confirm-email",
  "/api/auth/resend-confirmation",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

const isNoRefreshEndpoint = (url?: string) => {
  const path = (url ?? "").split("?")[0];
  return NO_REFRESH_ENDPOINTS.some(p => path.endsWith(p));
};

// Публичные email-эндпоинты: access-токен им не нужен, не отправляем его даже если пользователь вошёл.
const PUBLIC_EMAIL_ENDPOINTS = [
  "/api/auth/confirm-email",
  "/api/auth/resend-confirmation",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];
const isPublicEmailEndpoint = (url?: string) => {
  const path = (url ?? "").split("?")[0];
  return PUBLIC_EMAIL_ENDPOINTS.some(p => path.endsWith(p));
};

/** Каждая неудачная отправка запроса оставляет след в консоли: метод, адрес, статус и код трассировки сервера (traceId). */
function logApiFailure(err: unknown) {
  if (!axios.isAxiosError(err)) return;
  const status = err.response?.status;
  // 401 перехватывается и обрабатывается обновлением токена; 404 у необязательных ресурсов — обычное дело
  if (status === 401) return;
  const traceId = (err.response?.data as { traceId?: string } | undefined)?.traceId;
  const info = { method: err.config?.method?.toUpperCase(), url: err.config?.url, status: status ?? err.code ?? 'нет ответа', traceId };
  (status !== undefined && status < 500 ? console.warn : console.error)('[api] Запрос не выполнен:', info);
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.request.use(async (config) => {
  if (isPublicEmailEndpoint(config.url)) {
    delete config.headers.Authorization;
    return config;
  }
  let token = getAccessToken();
  // Токен уже истёк (или вот-вот истечёт): обновляем сессию ДО запроса. Иначе запрос сначала получает 401
  // (ошибка в консоли браузера), потом идёт refresh и повтор — три запроса вместо двух, отправка заметно медленнее.
  if (token && getRefreshToken() && !isNoRefreshEndpoint(config.url) && accessTokenExpiresSoon(token)) {
    await refreshSession(token); // при сбое (unavailable/invalid) запрос уйдёт как раньше, и сработает обычный путь через 401
    token = getAccessToken();
  }
  if (token) config.headers.Authorization = "Bearer " + token;
  else delete config.headers.Authorization;
  return config;
});

apiClient.interceptors.response.use(
  (r) => {
    // Адреса изображений приходят относительными (/api/images/…): дополняем их адресом API один раз здесь.
    if (r.data && typeof r.data === "object" && !(r.data instanceof Blob)) absolutizeImageUrls(r.data);
    return r;
  },
  async (err) => {
    const config = err?.config as RetriableConfig | undefined;
    logApiFailure(err);
    if (
      !axios.isAxiosError(err) ||
      err.response?.status !== 401 ||
      !config ||
      config._retry ||               // один повтор на запрос: бесконечного цикла быть не может
      isNoRefreshEndpoint(config.url) ||
      !getRefreshToken()
    ) {
      return Promise.reject(err);
    }

    config._retry = true;
    const sentToken = String(config.headers?.Authorization ?? "").replace(/^Bearer\s+/i, "") || undefined;

    // Все параллельные 401 ждут один и тот же refresh.
    const result = await refreshSession(sentToken);
    if (result === "ok") return apiClient.request(config); // перехватчик запроса подставит новый access-токен

    if (result === "unavailable") markRefreshUnavailable(err); // 429/5xx/сеть: сессия сохранена
    return Promise.reject(err); // invalid: сессия уже очищена, AuthContext получил уведомление
  }
);
