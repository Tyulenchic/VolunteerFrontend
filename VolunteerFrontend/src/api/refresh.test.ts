import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { authApi } from "./auth";
import { FakeServer } from "../test/fakeServer";
import { API_TIMEOUT_MS } from "../config";
import { clearSession, getAccessToken, getRefreshToken, isRefreshUnavailable, onSessionCleared, setTokens } from "../auth/session";

let server: FakeServer;

beforeEach(() => {
  localStorage.clear();
  server = new FakeServer();
});

/** access-токен локально «просрочен»: у сервера уже другой, но refresh-сессия жива. */
const expiredAccessValidRefresh = () => {
  setTokens("A0-expired", "R1");
};

describe("single-flight refresh", () => {
  it("sends exactly one refresh for concurrent 401s and retries every request with the new token", async () => {
    expiredAccessValidRefresh();
    server.holdRefresh = true;

    const calls = ["/api/a", "/api/b", "/api/c", "/api/d"].map(u => apiClient.get(u));
    await vi.waitFor(() => expect(server.refreshCalls.length).toBe(1)); // все 401 уже получены и ждут один refresh
    server.release();
    const results = await Promise.all(calls);

    expect(server.refreshCalls).toEqual(["R1"]);                  // не четыре одновременных refresh одним токеном
    expect(results.map(r => r.status)).toEqual([200, 200, 200, 200]);
    expect(getAccessToken()).toBe("A2");
    expect(getRefreshToken()).toBe("R2");
    expect(server.protectedCalls).toBe(8);                        // 4 неудачных + 4 повтора
  });

  it("does not refresh again for a late 401 that was sent with an already replaced token", async () => {
    expiredAccessValidRefresh();
    server.holdProtectedUrl = "/api/slow";

    // «медленный» запрос уходит со старым токеном и получит 401 только после того, как токен уже обновлён
    const slow = apiClient.get("/api/slow");
    await vi.waitFor(() => expect(server.protectedCalls).toBe(1));
    server.holdProtectedUrl = null;
    await apiClient.get("/api/fast");                             // его 401 запускает refresh: A0-expired → A2
    expect(server.refreshCalls.length).toBe(1);

    server.releaseProtected();                                    // поздний 401 для slow
    const res = await slow;

    expect(res.status).toBe(200);                                 // повтор с новым токеном
    expect(server.refreshCalls.length).toBe(1);                   // второго refresh (с уже ротированным токеном) нет
  });

  it("keeps the rotated refresh token usable for the next cycle (no reuse of the old one)", async () => {
    expiredAccessValidRefresh();
    await apiClient.get("/api/a");
    server.validAccess = "A9"; // access снова «истёк»
    await apiClient.get("/api/b");
    expect(server.refreshCalls).toEqual(["R1", "R2"]);
  });
});

describe("refresh failure", () => {
  it("clears the session, notifies listeners and stops when refresh answers 401", async () => {
    expiredAccessValidRefresh();
    server.refreshMode = "reject401";
    const cleared = vi.fn();
    const off = onSessionCleared(cleared);

    const calls = [apiClient.get("/api/a"), apiClient.get("/api/b")];
    const results = await Promise.allSettled(calls);
    off();

    expect(results.every(r => r.status === "rejected")).toBe(true);
    expect(server.refreshCalls.length).toBe(1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(cleared).toHaveBeenCalled();
  });

  it.each(["status429", "status503", "network", "timeout"] as const)("does NOT clear the session on a temporary refresh failure (%s)", async (mode) => {
    expiredAccessValidRefresh();
    server.refreshMode = mode;
    const cleared = vi.fn();
    const off = onSessionCleared(cleared);

    const err = await apiClient.get("/api/a").catch(e => e);
    off();

    expect(isRefreshUnavailable(err)).toBe(true);
    expect(getRefreshToken()).toBe("R1");
    expect(getAccessToken()).toBe("A0-expired");
    expect(cleared).not.toHaveBeenCalled();
  });
});

describe("no infinite loops / no accidental refresh", () => {
  it("retries a request at most once even if the retried request is still 401", async () => {
    expiredAccessValidRefresh();
    server.protectedAlways401 = true;

    await expect(apiClient.get("/api/a")).rejects.toMatchObject({ response: { status: 401 } });

    expect(server.refreshCalls.length).toBe(1);
    expect(server.protectedCalls).toBe(2);
    // сессия при этом не уничтожена: нормальный 401 защищённого эндпоинта — не провал refresh
    expect(getRefreshToken()).toBe("R2");
  });

  it("does not refresh when there is no refresh token", async () => {
    localStorage.setItem("accessToken", "A0-expired");
    await expect(apiClient.get("/api/a")).rejects.toMatchObject({ response: { status: 401 } });
    expect(server.refreshCalls.length).toBe(0);
  });

  it("does not try to refresh on a 401 from login (wrong password)", async () => {
    localStorage.setItem("refreshToken", "R1");
    server.protectedAlways401 = true;
    await expect(authApi.login({ email: "a@example.test", password: "x" })).rejects.toBeTruthy();
    expect(server.refreshCalls.length).toBe(0);
    expect(getRefreshToken()).toBe("R1");
  });
});

describe("logout", () => {
  it("revokes the session with an expired access token, without an Authorization header, and clears tokens", async () => {
    expiredAccessValidRefresh();

    await authApi.logout();

    expect(server.logoutCalls).toEqual([{ refreshToken: "R1", authorization: undefined }]);
    expect(server.refreshCalls.length).toBe(0);                    // logout не пытается обновлять сессию
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("clears local tokens even if the server fails", async () => {
    expiredAccessValidRefresh();
    server.logoutStatus = 500;
    await authApi.logout();
    expect(getRefreshToken()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("is a harmless no-op without tokens", async () => {
    await authApi.logout();
    expect(server.logoutCalls.length).toBe(0);
  });

  it("is not undone by a refresh that finishes after logout", async () => {
    expiredAccessValidRefresh();
    server.holdRefresh = true;

    const pending = apiClient.get("/api/a").catch(e => e);
    await vi.waitFor(() => expect(server.refreshCalls.length).toBe(1));
    await authApi.logout();                                        // пользователь вышел, пока refresh в полёте
    server.release();
    await pending;

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

describe("timeout and public email endpoints", () => {
  it("every request (including refresh) has a timeout", async () => {
    const { refreshHttp } = await import("../auth/session");
    expect(API_TIMEOUT_MS).toBeGreaterThanOrEqual(15_000);
    expect(API_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
    expect(apiClient.defaults.timeout).toBe(API_TIMEOUT_MS);
    expect(refreshHttp.defaults.timeout).toBe(API_TIMEOUT_MS);
  });

  it("a timed-out refresh keeps single-flight (one call for concurrent 401s) and does not log the user out", async () => {
    expiredAccessValidRefresh();
    server.refreshMode = "timeout";
    const results = await Promise.all(["/api/a", "/api/b", "/api/c"].map(u => apiClient.get(u).catch(e => e)));
    expect(server.refreshCalls.length).toBe(1);
    expect(results.every(isRefreshUnavailable)).toBe(true);
    expect(getRefreshToken()).toBe("R1");
  });

  it.each(["/api/auth/confirm-email", "/api/auth/resend-confirmation", "/api/auth/forgot-password", "/api/auth/reset-password"])(
    "does not send Authorization to %s even when logged in", async (url) => {
      setTokens("A1", "R1");
      await apiClient.post(url, {});
      expect(server.publicCalls.at(-1)).toMatchObject({ url, authorization: undefined });
    });

  it("still sends Authorization to protected endpoints", async () => {
    setTokens("A1", "R1");
    const res = await apiClient.get("/api/users/me");
    expect(res.status).toBe(200);
  });

  it("a failing public email endpoint never triggers a refresh", async () => {
    setTokens("A0-expired", "R1");
    server.publicResponses["/api/auth/reset-password"] = { status: 401 };
    await expect(apiClient.post("/api/auth/reset-password", {})).rejects.toBeTruthy();
    expect(server.refreshCalls.length).toBe(0);
  });
});

describe("session helpers", () => {
  it("clearSession wipes both tokens", () => {
    setTokens("a", "r");
    clearSession();
    expect([getAccessToken(), getRefreshToken()]).toEqual([null, null]);
  });
});

describe("proactive refresh of an expired JWT", () => {
  /** JWT-подобный токен с заданным exp (секунды): подпись клиент не проверяет, читает только полезную нагрузку. */
  const jwt = (expSec: number) => `h.${btoa(JSON.stringify({ exp: expSec })).replace(/=+$/, "")}.s`;
  const now = () => Math.floor(Date.now() / 1000);

  it("refreshes before sending, so the request is not rejected with 401 first", async () => {
    setTokens(jwt(now() - 60), "R1");
    const res = await apiClient.post("/api/feedback", { message: "hi" });

    expect(res.status).toBe(200);
    expect(server.refreshCalls).toEqual(["R1"]);
    expect(server.protectedCalls).toBe(1); // один запрос: без 401 и повтора
    expect(getAccessToken()).toBe("A2");
  });

  it("concurrent requests with an expired token share one refresh", async () => {
    setTokens(jwt(now() - 60), "R1");
    await Promise.all(["/api/a", "/api/b", "/api/c"].map(u => apiClient.get(u)));

    expect(server.refreshCalls).toEqual(["R1"]);
    expect(server.protectedCalls).toBe(3);
  });

  it("does not refresh a token that is still valid for long", async () => {
    const fresh = jwt(now() + 3600);
    setTokens(fresh, "R1");
    server.validAccess = fresh;
    await apiClient.get("/api/a");

    expect(server.refreshCalls).toEqual([]);
    expect(server.protectedCalls).toBe(1);
  });
});
