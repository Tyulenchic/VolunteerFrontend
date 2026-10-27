import { describe, expect, it } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { classifyApiError, mapApiError, MESSAGES } from "./apiError";
import { PASSWORD_MAX_BYTES, passwordByteLength, validateNewPassword } from "./password";

const config = {} as InternalAxiosRequestConfig;
const httpError = (status: number, data?: unknown) =>
  new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, { data, status, statusText: "", headers: {}, config });

describe("mapApiError", () => {
  it("A: shows the backend {error} text", () => {
    expect(mapApiError(httpError(400, { error: "Токен недействителен или уже был использован." }))).toBe("Токен недействителен или уже был использован.");
    expect(mapApiError(httpError(401, { error: "Неверный email или пароль." }))).toBe("Неверный email или пароль.");
  });

  it("B: {message:'Validation failed', errors} → concrete field messages, not the technical message", () => {
    const text = mapApiError(httpError(400, { message: "Validation failed", errors: { Email: ["Неверный адрес."], Password: ["Слишком короткий."] } }));
    expect(text).toBe("Неверный адрес. Слишком короткий.");
    expect(text).not.toMatch(/Validation failed/i);
  });

  it("C: ProblemDetails → field errors, never the English title", () => {
    const withErrors = mapApiError(httpError(400, { title: "One or more validation errors occurred.", status: 400, errors: { Token: ["The Token field is required."] } }));
    expect(withErrors).toBe("The Token field is required.");
    const technicalOnly = mapApiError(httpError(400, { title: "One or more validation errors occurred.", errors: { dto: ["The dto field is required."], "$.newPassword": ["The JSON value could not be converted"] } }));
    expect(technicalOnly).toBe(MESSAGES.validation);
    expect(mapApiError(httpError(400, { title: "One or more validation errors occurred." }))).toBe(MESSAGES.validation);
  });

  it("D: 429 (with or without body, any English text) → neutral Russian message", () => {
    expect(mapApiError(httpError(429))).toBe(MESSAGES.rateLimited);
    expect(mapApiError(httpError(429, ""))).toBe(MESSAGES.rateLimited);
    expect(mapApiError(httpError(429, { error: "Too many requests for this email" }))).toBe(MESSAGES.rateLimited);
    expect(MESSAGES.rateLimited).toBe("Слишком много попыток. Попробуйте позже.");
  });

  it("E: network error and timeout", () => {
    const network = new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
    const timeout = new AxiosError("timeout of 20000ms exceeded", AxiosError.ECONNABORTED, config);
    expect(mapApiError(network)).toBe(MESSAGES.network);
    expect(mapApiError(timeout)).toBe(MESSAGES.timeout);
    expect(classifyApiError(network)).toBe("network");
    expect(classifyApiError(timeout)).toBe("timeout");
  });

  it("5xx → temporary-server message, internal details are never shown", () => {
    expect(mapApiError(httpError(500, { error: "Внутренняя ошибка сервера.", detail: "System.NullReferenceException at ..." }))).toBe(MESSAGES.server);
    expect(mapApiError(httpError(503))).toBe(MESSAGES.server);
  });

  it("F: HTML from a proxy is never shown", () => {
    const html = "<html><body><h1>502 Bad Gateway</h1></body></html>";
    expect(mapApiError(httpError(502, html))).toBe(MESSAGES.server);
    expect(mapApiError(httpError(400, html))).toBe(MESSAGES.generic);
    expect(mapApiError(httpError(400, { error: "<script>alert(1)</script>" }))).not.toContain("<");
  });

  it("never leaks objects, axios internals or undefined", () => {
    for (const e of [httpError(400, { error: { nested: true } }), httpError(404, {}), new Error("secret internal message"), "boom", undefined, null]) {
      const text = mapApiError(e);
      expect(typeof text).toBe("string");
      expect(text).not.toMatch(/\[object|undefined|secret internal|AxiosError/);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("classifies kinds", () => {
    expect(classifyApiError(httpError(400))).toBe("invalid");
    expect(classifyApiError(httpError(429))).toBe("rate_limited");
    expect(classifyApiError(httpError(500))).toBe("server");
    expect(classifyApiError(new Error("x"))).toBe("other");
  });
});

describe("password policy", () => {
  it("measures UTF-8 bytes, not string length", () => {
    expect(passwordByteLength("abc")).toBe(3);
    expect(passwordByteLength("ж")).toBe(2);
    expect(passwordByteLength("😀")).toBe(4);
  });

  it("accepts 8..72 bytes and rejects shorter or longer", () => {
    expect(validateNewPassword("1234567")).toMatch(/Минимум 8/);
    expect(validateNewPassword("12345678")).toBeNull();
    expect(validateNewPassword("a".repeat(PASSWORD_MAX_BYTES))).toBeNull();
    expect(validateNewPassword("a".repeat(PASSWORD_MAX_BYTES + 1))).toMatch(/слишком длинный/);
    // 40 кириллических символов = 80 байт: короткий по длине строки, но длинный по байтам
    expect("ж".repeat(40).length).toBeLessThan(PASSWORD_MAX_BYTES);
    expect(validateNewPassword("ж".repeat(40))).toMatch(/слишком длинный/);
    expect(validateNewPassword("ж".repeat(36))).toBeNull();
  });

  it('к сбою сервера добавляет код трассировки, чтобы найти запись в журнале', () => {
    expect(mapApiError(httpError(500, { error: "Внутренняя ошибка сервера.", traceId: "0HNPCJCKMI6MK:000000DD" })))
      .toBe(`${MESSAGES.server} Код ошибки: 0HNPCJCKMI6MK:000000DD`);
    // чужое содержимое в traceId не показываем
    expect(mapApiError(httpError(500, { traceId: "<script>alert(1)</script>" }))).toBe(MESSAGES.server);
  });
});
