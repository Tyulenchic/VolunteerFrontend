import axios from "axios";

/**
 * Единый безопасный разбор ошибок API. Пользователю никогда не показываются: HTML, stack trace,
 * объекты axios, «[object Object]», английские технические строки лимитеров/валидаторов.
 *
 * Форматы backend:
 *  A. { error }                                    — доменные ошибки (текст русский, безопасный)
 *  B. { message:"Validation failed", errors:{…} }  — FluentValidation
 *  C. ProblemDetails { title, errors }             — DataAnnotations / binding
 *  D. 429 без тела (встроенный limiter) или { error } (per-address limiter, англ. текст — не показываем)
 *  E. нет response — сеть / таймаут;  F. HTML от прокси.
 */

export type ApiErrorKind = "invalid" | "rate_limited" | "network" | "timeout" | "server" | "other";

export const MESSAGES = {
  rateLimited: "Слишком много попыток. Попробуйте позже.",
  network: "Не удалось подключиться к серверу. Проверьте соединение и попробуйте ещё раз.",
  timeout: "Сервер слишком долго не отвечает. Проверьте соединение и попробуйте ещё раз.",
  server: "Сервер временно недоступен. Попробуйте ещё раз позже.",
  validation: "Проверьте введённые данные.",
  generic: "Произошла ошибка. Попробуйте ещё раз.",
} as const;

const MAX_TEXT = 300;
const MAX_VALIDATION_ITEMS = 3;

export function classifyApiError(err: unknown): ApiErrorKind {
  if (!axios.isAxiosError(err)) return "other";
  const status = err.response?.status;
  if (status === undefined) {
    return err.code === "ECONNABORTED" || err.code === "ETIMEDOUT" ? "timeout" : "network";
  }
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  if (status >= 400) return "invalid";
  return "other";
}

/** Строка пригодна для показа: непустая, не слишком длинная, не HTML. */
const safeText = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > MAX_TEXT || /[<>]/.test(s)) return null;
  return s;
};

/** Сообщения валидации: пропускаем технические ключи JSON-биндинга ("$.x", "dto"). */
function validationMessages(errors: unknown): string[] {
  if (!errors || typeof errors !== "object") return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (key.startsWith("$") || key === "dto") continue;
    const list = Array.isArray(value) ? value : [value];
    for (const item of list) {
      const text = safeText(item);
      if (text) out.push(text);
    }
  }
  return out.slice(0, MAX_VALIDATION_ITEMS);
}

/** К сообщению о сбое сервера добавляется код трассировки: по нему администратор находит запись в журнале. */
function withTraceId(text: string, err: unknown): string {
  const id = axios.isAxiosError(err) ? (err.response?.data as { traceId?: unknown } | undefined)?.traceId : undefined;
  return typeof id === "string" && /^[\w:-]{4,64}$/.test(id) ? `${text} Код ошибки: ${id}` : text;
}

export function mapApiError(err: unknown): string {
  const kind = classifyApiError(err);
  if (kind === "network") return MESSAGES.network;
  if (kind === "timeout") return MESSAGES.timeout;
  if (kind === "rate_limited") return MESSAGES.rateLimited;
  if (kind === "server") return withTraceId(MESSAGES.server, err);
  if (kind === "other" || !axios.isAxiosError(err)) return MESSAGES.generic;

  // 4xx
  const data: unknown = err.response?.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const specific = safeText(d.error);
    if (specific) return specific;
    const fields = validationMessages(d.errors);
    if (fields.length > 0) return fields.join(" ");
    if (d.errors && typeof d.errors === "object") return MESSAGES.validation;
    // «Validation failed» / «One or more validation errors…» — техническая строка, не показываем.
    const message = safeText(d.message);
    if (message && !/validation/i.test(message)) return message;
    const status = err.response?.status;
    return status === 400 || status === 422 ? MESSAGES.validation : MESSAGES.generic;
  }
  // Строка: HTML (прокси) и любой «сырой» текст не показываем.
  return MESSAGES.generic;
}
