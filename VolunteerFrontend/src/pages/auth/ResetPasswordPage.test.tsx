import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { FakeServer } from "../../test/fakeServer";
import { renderRoutes } from "../../test/render";
import { getAccessToken, getRefreshToken, setTokens } from "../../auth/session";

let server: FakeServer;
const URL = "/api/auth/reset-password";
const routes = [
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/login", element: <div>LOGIN PAGE</div> },
  { path: "/forgot-password", element: <div>FORGOT PAGE</div> },
];

const fill = (password: string, confirm = password) => {
  const fields = screen.getAllByPlaceholderText(/Минимум 8 символов|••••••••/) as HTMLInputElement[];
  fireEvent.change(fields[0], { target: { value: password } });
  fireEvent.change(fields[1], { target: { value: confirm } });
};
const submit = () => fireEvent.click(screen.getByRole("button", { name: /Установить пароль/ }));

beforeEach(() => { cleanup(); localStorage.clear(); server = new FakeServer(); });

describe("ResetPasswordPage", () => {
  it("POSTs { token, newPassword }, clears the local session and replaces the history entry with /login", async () => {
    setTokens("A1", "R1");                       // пользователь уже вошёл в этом браузере
    const { router } = renderRoutes(routes, ["/", "/reset-password?token=reset-tok"]);
    await screen.findByPlaceholderText("Минимум 8 символов");
    await waitFor(() => expect(server.requestLog).toContain("GET /api/users/me")); // сессия восстановлена
    const refreshBefore = server.refreshCalls.length;

    fill("NewPassw0rd!");
    submit();

    await screen.findByText("LOGIN PAGE");
    expect(server.publicCalls).toEqual([{ url: URL, body: { token: "reset-tok", newPassword: "NewPassw0rd!" }, authorization: undefined }]);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(server.logoutCalls).toEqual([]);                    // старый refresh-токен не отправляется
    expect(server.refreshCalls.length).toBe(refreshBefore);    // и не обновляется
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.historyAction).toBe("REPLACE");        // токен не остаётся в истории
  });

  it("a refresh that finishes after the reset cannot resurrect the old session", async () => {
    setTokens("A0-expired", "R1");
    server.holdRefresh = true;
    renderRoutes(routes, ["/reset-password?token=t"]);        // restore запускает refresh
    await waitFor(() => expect(server.refreshCalls.length).toBe(1));

    await screen.findByPlaceholderText("Минимум 8 символов");
    fill("NewPassw0rd!");
    submit();
    await screen.findByText("LOGIN PAGE");
    server.release();
    await new Promise(r => setTimeout(r, 50));

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("missing token → explicit state, no form, no request", async () => {
    renderRoutes(routes, ["/reset-password"]);
    await screen.findByText("Ссылка недействительна");
    expect(screen.queryByRole("button", { name: /Установить пароль/ })).toBeNull();
    expect(screen.getByText("Запросить новую ссылку")).toBeTruthy();
    expect(server.publicCalls).toEqual([]);
  });

  it("client-side validation: mismatch, too short, too long in UTF-8 bytes — no request", async () => {
    renderRoutes(routes, ["/reset-password?token=t"]);
    await screen.findByPlaceholderText("Минимум 8 символов");

    fill("NewPassw0rd!", "Different0ne!"); submit();
    await screen.findByText("Пароли не совпадают");
    fill("short"); submit();
    await screen.findByText("Минимум 8 символов", { selector: "div" });
    fill("ж".repeat(40)); submit();                           // 40 символов, но 80 байт
    await screen.findByText(/слишком длинный/);
    expect(server.publicCalls).toEqual([]);
  });

  it("new-password autocomplete on both fields", async () => {
    renderRoutes(routes, ["/reset-password?token=t"]);
    const fields = (await screen.findAllByPlaceholderText(/Минимум 8 символов|••••••••/)) as HTMLInputElement[];
    expect(fields.map(f => f.autocomplete)).toEqual(["new-password", "new-password"]);
  });

  it("400 → backend message plus a link to request a new one; session untouched", async () => {
    setTokens("A1", "R1");
    server.publicResponses[URL] = { status: 400, data: { error: "Срок действия токена истёк." } };
    renderRoutes(routes, ["/reset-password?token=t"]);
    await screen.findByPlaceholderText("Минимум 8 символов");
    fill("NewPassw0rd!"); submit();

    await screen.findByText(/Срок действия токена истёк\./);
    expect(screen.getByText("Запросить новую ссылку")).toBeTruthy();
    expect(getRefreshToken()).toBe("R1");                      // сброс не удался — сессия не трогается
  });

  it.each([
    ["429", { status: 429 } as const, /Слишком много попыток/],
    ["5xx", { status: 500, data: { error: "Внутренняя ошибка сервера.", detail: "stack trace" } } as const, /Сервер временно недоступен/],
    ["network", "network" as const, /Не удалось подключиться к серверу/],
  ])("%s → readable message, form stays usable", async (_name, response, expected) => {
    server.publicResponses[URL] = response;
    renderRoutes(routes, ["/reset-password?token=t"]);
    await screen.findByPlaceholderText("Минимум 8 символов");
    fill("NewPassw0rd!"); submit();

    await screen.findByText(expected);
    expect(screen.queryByText(/stack trace/)).toBeNull();
    expect((screen.getByRole("button", { name: /Установить пароль/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});
