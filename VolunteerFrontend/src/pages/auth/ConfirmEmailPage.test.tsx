import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { ConfirmEmailPage } from "./ConfirmEmailPage";
import { FakeServer } from "../../test/fakeServer";
import { renderRoutes } from "../../test/render";
import { setTokens } from "../../auth/session";

let server: FakeServer;
const URL = "/api/auth/confirm-email";
const confirmButton = () => screen.getByRole("button") as HTMLButtonElement;
const routes = [{ path: "/confirm-email", element: <ConfirmEmailPage /> }, { path: "/login", element: <div>LOGIN</div> }];

beforeEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); window.location.hash = ""; server = new FakeServer(); });
afterEach(() => { vi.useRealTimers(); });

describe("ConfirmEmailPage", () => {
  it("reads the token from the HashRouter query and POSTs { token } only after the click", async () => {
    window.location.hash = "#/confirm-email?token=tok-123";
    render(<HashRouter><Routes><Route path="/confirm-email" element={<ConfirmEmailPage />} /></Routes></HashRouter>);

    // нет автоматического запроса при открытии страницы (защита от почтовых сканеров)
    await new Promise(r => setTimeout(r, 50));
    expect(server.publicCalls).toEqual([]);
    expect(window.location.search).toBe(""); // токен не из обычного location.search

    fireEvent.click(confirmButton());
    await screen.findByText("Email подтверждён!");

    expect(server.publicCalls).toEqual([{ url: URL, body: { token: "tok-123" }, authorization: undefined }]);
    expect(server.requestLog.filter(r => r.startsWith("GET")).length).toBe(0); // никаких GET
    // использованный токен убран из адреса/истории
    expect(window.location.hash).toBe("#/confirm-email");
  });

  it("never stores the token and never shows it", async () => {
    const { container } = renderRoutes(routes, ["/confirm-email?token=secret-token-xyz"]);
    expect(container.textContent).not.toContain("secret-token-xyz");
    fireEvent.click(await screen.findByRole("button"));
    await screen.findByText("Email подтверждён!");

    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(stored).not.toContain("secret-token-xyz");
    expect(container.textContent).not.toContain("secret-token-xyz");
  });

  it("does not send the access token with the public request, even when logged in", async () => {
    setTokens("A1", "R1");
    renderRoutes(routes, ["/confirm-email?token=t"]);
    fireEvent.click(await screen.findByRole("button", { name: /Подтвердить email/ }));
    await screen.findByText("Email подтверждён!");
    expect(server.publicCalls[0].authorization).toBeUndefined();
  });

  it("missing token → explicit state with resend, and no request", async () => {
    renderRoutes(routes, ["/confirm-email"]);
    await screen.findByText("Ссылка недействительна");
    expect(screen.getByPlaceholderText("your@email.com")).toBeTruthy();
    expect(server.publicCalls).toEqual([]);
  });

  it("400 (invalid / expired / used) → invalid-link state with resend, no confirm retry", async () => {
    server.publicResponses[URL] = { status: 400, data: { error: "Срок действия токена истёк." } };
    renderRoutes(routes, ["/confirm-email?token=t"]);
    fireEvent.click(await screen.findByRole("button"));

    await screen.findByText("Ссылка недействительна или устарела");
    expect(screen.getByText(/Срок действия токена истёк\./)).toBeTruthy();
    expect(screen.getByPlaceholderText("your@email.com")).toBeTruthy(); // запросить новое письмо
    expect(screen.queryByRole("button", { name: /Подтвердить email|Повторить/ })).toBeNull();
  });

  it("network error → NOT 'invalid link'; the button stays and the retry succeeds", async () => {
    server.publicResponses[URL] = "network";
    renderRoutes(routes, ["/confirm-email?token=t"]);
    fireEvent.click(await screen.findByRole("button"));

    await screen.findByText(/Не удалось подключиться к серверу/);
    expect(screen.queryByText(/недействительна/)).toBeNull();
    expect(confirmButton().textContent).toBe("Повторить");

    delete server.publicResponses[URL]; // сервер снова доступен
    fireEvent.click(confirmButton());
    await screen.findByText("Email подтверждён!");
    expect(server.publicCalls.length).toBe(2);
  });

  it("timeout and 5xx are temporary too", async () => {
    server.publicResponses[URL] = "timeout";
    renderRoutes(routes, ["/confirm-email?token=t"]);
    fireEvent.click(await screen.findByRole("button"));
    await screen.findByText(/слишком долго не отвечает/);
    expect(confirmButton().textContent).toBe("Повторить");

    cleanup();
    server.publicResponses[URL] = { status: 503, data: "<html>Bad gateway</html>" };
    renderRoutes(routes, ["/confirm-email?token=t"]);
    fireEvent.click(await screen.findByRole("button"));
    await screen.findByText(/Сервер временно недоступен/);
    expect(screen.queryByText(/Bad gateway/)).toBeNull();
    expect(confirmButton().textContent).toBe("Повторить");
  });

  it("429 → neutral message, token not declared invalid, retry only after a cooldown", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.publicResponses[URL] = { status: 429 };
    renderRoutes(routes, ["/confirm-email?token=t"]);
    fireEvent.click(await screen.findByRole("button"));

    await screen.findByText(/Слишком много попыток\. Попробуйте позже\./);
    expect(screen.queryByText(/недействительна/)).toBeNull();
    expect(confirmButton().disabled).toBe(true);
    expect(confirmButton().textContent).toMatch(/Повторить \(через \d+ с\)/);

    delete server.publicResponses[URL];
    for (let i = 0; i < 31; i++) await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); // тик = ререндер
    await waitFor(() => expect(confirmButton().disabled).toBe(false));
    fireEvent.click(confirmButton());
    await screen.findByText("Email подтверждён!");
  });
});
