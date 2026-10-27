import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "../api/client";
import { refreshHttp } from "../auth/session";

/**
 * Минимальная модель бэкенда для тестов (без сети): access-токен «живёт», пока совпадает с server.validAccess;
 * refresh ротируется (использованный токен недействителен); отказ refresh — 401.
 * Подменяются адаптеры axios, поэтому проходят реальные перехватчики apiClient и реальный single-flight.
 */
export class FakeServer {
  validAccess = "A1";
  validRefresh = "R1";
  seq = 1;

  refreshCalls: string[] = [];          // refresh-токены, с которыми приходили на /refresh
  protectedCalls = 0;
  logoutCalls: { refreshToken: string; authorization?: string }[] = [];
  requestLog: string[] = [];

  /** Если задан — ответ /refresh откладывается до вызова release() (имитация сетевой задержки). */
  holdRefresh = false;
  private releaseFn: (() => void) | null = null;
  private gate: Promise<void> | null = null;

  /** Ответ на этот URL откладывается до releaseProtected(); статус определяется в момент ПРИХОДА запроса. */
  holdProtectedUrl: string | null = null;
  private protectedGate: (() => void) | null = null;
  releaseProtected() { this.protectedGate?.(); }

  refreshMode: "rotate" | "reject401" | "status429" | "status503" | "network" | "timeout" = "rotate";

  /** Публичные auth-эндпоинты: запросы пишутся в publicCalls, ответ берётся из publicResponses (иначе — по умолчанию). */
  publicCalls: { url: string; body: unknown; authorization?: string }[] = [];
  publicResponses: Record<string, { status: number; data?: unknown } | "network" | "timeout"> = {};
  private static PUBLIC_DEFAULTS: Record<string, { status: number; data?: unknown }> = {
    "/api/auth/register": { status: 202, data: { message: "ok" } },
    "/api/auth/login": { status: 401, data: { error: "Неверный email или пароль." } },
    "/api/auth/confirm-email": { status: 200, data: { message: "ok" } },
    "/api/auth/resend-confirmation": { status: 204 },
    "/api/auth/forgot-password": { status: 204 },
    "/api/auth/reset-password": { status: 204 },
  };
  protectedAlways401 = false;
  logoutStatus = 204;

  constructor() {
    apiClient.defaults.adapter = this.adapter;
    refreshHttp.defaults.adapter = this.adapter;
  }

  release() { this.releaseFn?.(); }

  private respond(config: InternalAxiosRequestConfig, status: number, data: unknown = {}) {
    const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
    if (status >= 400) {
      return Promise.reject(new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response));
    }
    return Promise.resolve(response);
  }

  private adapter: AxiosAdapter = async (config) => {
    const url = (config.url ?? "").split("?")[0];
    const auth = config.headers?.Authorization ? String(config.headers.Authorization) : undefined;
    this.requestLog.push(`${(config.method ?? "get").toUpperCase()} ${url}`);

    if (url === "/api/auth/refresh") {
      const body = JSON.parse(String(config.data));
      this.refreshCalls.push(body.refreshToken);
      if (this.holdRefresh) {
        this.gate ??= new Promise<void>(r => { this.releaseFn = r; });
        await this.gate;
        this.gate = null;
      }
      switch (this.refreshMode) {
        case "network": return Promise.reject(new AxiosError("Network Error", AxiosError.ERR_NETWORK, config));
        case "timeout": return Promise.reject(new AxiosError("timeout of 20000ms exceeded", AxiosError.ECONNABORTED, config));
        case "status429": return this.respond(config, 429);
        case "status503": return this.respond(config, 503);
        case "reject401": return this.respond(config, 401, { error: "Сессия недействительна. Выполните вход заново." });
      }
      if (body.refreshToken !== this.validRefresh) return this.respond(config, 401); // reuse / неизвестный
      this.seq++;
      this.validAccess = `A${this.seq}`;
      this.validRefresh = `R${this.seq}`;
      return this.respond(config, 200, { accessToken: this.validAccess, refreshToken: this.validRefresh });
    }

    if (url === "/api/auth/logout") {
      const body = JSON.parse(String(config.data));
      this.logoutCalls.push({ refreshToken: body.refreshToken, authorization: auth });
      return this.respond(config, this.logoutStatus);
    }

    if (url in FakeServer.PUBLIC_DEFAULTS) {
      this.publicCalls.push({ url, body: config.data ? JSON.parse(String(config.data)) : undefined, authorization: auth });
      const r = this.publicResponses[url] ?? FakeServer.PUBLIC_DEFAULTS[url];
      if (r === "network") return Promise.reject(new AxiosError("Network Error", AxiosError.ERR_NETWORK, config));
      if (r === "timeout") return Promise.reject(new AxiosError("timeout of 20000ms exceeded", AxiosError.ECONNABORTED, config));
      return this.respond(config, r.status, r.data);
    }

    // защищённые эндпоинты
    this.protectedCalls++;
    const authorized = !this.protectedAlways401 && auth === `Bearer ${this.validAccess}`;
    if (url === this.holdProtectedUrl) await new Promise<void>(r => { this.protectedGate = r; });
    if (!authorized) return this.respond(config, 401);
    return this.respond(config, 200, url === "/api/users/me" ? { id: "u1", email: "u@example.test", role: "Volunteer" } : { ok: url });
  };
}
