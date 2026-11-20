import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { LoginPage } from "./LoginPage";
import { ResendConfirmationPage } from "./ResendConfirmationPage";
import { FakeServer } from "../../test/fakeServer";
import { renderRoutes } from "../../test/render";
import { getRefreshToken } from "../../auth/session";

let server: FakeServer;
beforeEach(() => { cleanup(); localStorage.clear(); server = new FakeServer(); });

describe("ForgotPasswordPage", () => {
  const routes = [{ path: "/forgot-password", element: <ForgotPasswordPage /> }];
  const send = (email: string) => {
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: /Отправить ссылку/ }));
  };

  it("POSTs { email } (camelCase, trimmed) and says where the letter went", async () => {
    renderRoutes(routes, ["/forgot-password"]);
    send("  User@Example.test ");

    await screen.findByText(/Мы отправили письмо с инструкциями на User@Example\.test/);
    expect(server.publicCalls).toEqual([{ url: "/api/auth/forgot-password", body: { email: "User@Example.test" }, authorization: undefined }]);
    expect(Object.keys(server.publicCalls[0].body as object)).toEqual(["email"]);
  });

  it("an address that is not registered gets a plain explanation and no success state", async () => {
    server.publicResponses["/api/auth/forgot-password"] = { status: 404, data: { error: "Пользователя с такой почтой не существует." } };
    renderRoutes(routes, ["/forgot-password"]);
    send("ghost@example.test");

    await screen.findByText("Пользователя с такой почтой не существует.");
    expect(screen.queryByText(/Мы отправили письмо/)).toBeNull();
    expect(screen.getByRole("button", { name: /Отправить ссылку/ })).toBeTruthy();
  });

  it.each([
    ["429", { status: 429 } as const, /Слишком много попыток\. Попробуйте позже\./],
    ["5xx", { status: 502, data: "<html>502</html>" } as const, /Сервер временно недоступен/],
    ["network", "network" as const, /Не удалось подключиться к серверу/],
    ["timeout", "timeout" as const, /слишком долго не отвечает/],
  ])("%s → readable message, no success state", async (_n, response, expected) => {
    server.publicResponses["/api/auth/forgot-password"] = response;
    renderRoutes(routes, ["/forgot-password"]);
    send("u@example.test");
    await screen.findByText(expected);
    expect(screen.queryByText(/мы отправили письмо/)).toBeNull();
    expect(screen.queryByText(/<html>/)).toBeNull();
  });
});

describe("LoginPage", () => {
  const routes = [
    { path: "/login", element: <LoginPage /> },
    { path: "/resend-confirmation", element: <ResendConfirmationPage /> },
    { path: "/profile", element: <div>PROFILE</div> },
  ];
  const login = (email = "user@example.test", password = "wrong-password") => {
    fireEvent.change(screen.getByLabelText("Email или логин"), { target: { value: email } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: password } });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));
  };

  it("shows no resend hint before a failed attempt", () => {
    renderRoutes(routes, ["/login"]);
    expect(screen.queryByText(/Не пришло письмо подтверждения/)).toBeNull();
  });

  it("failed login → backend error text and a NEUTRAL resend link (no claim about the account state)", async () => {
    renderRoutes(routes, ["/login"]);
    login();

    await screen.findByText("Неверный email или пароль.");
    const link = screen.getByRole("link", { name: "Отправить ещё раз" });
    expect(link.getAttribute("href")).toBe("/resend-confirmation");
    expect(screen.queryByText(/не подтвержд/i)).toBeNull();   // состояние аккаунта не раскрывается
    expect(server.requestLog.filter(r => r.includes("resend")).length).toBe(0); // и автоматического запроса нет
    expect(getRefreshToken()).toBeNull();
  });

  it("a blocked person who typed the right password is told about the block, with no hint about the confirmation letter", async () => {
    server.publicResponses["/api/auth/login"] = { status: 403, data: { error: "Вы были заблокированы за несоблюдение правил сообщества. Причина: Спам. Если вы считаете, что это ошибка, напишите нам через страницу «Обратная связь»." } };
    renderRoutes(routes, ["/login"]);
    login();

    expect((await screen.findByRole("alert")).textContent).toContain("Вы были заблокированы за несоблюдение правил сообщества. Причина: Спам.");
    expect(screen.queryByText(/Не пришло письмо подтверждения/)).toBeNull();
    expect(screen.queryByText(/Неверный email или пароль/)).toBeNull();
  });

  it("the link opens the resend page with the email prefilled (via router state) and sends nothing by itself", async () => {
    renderRoutes(routes, ["/login"]);
    login("  me@example.test ");
    fireEvent.click(await screen.findByRole("link", { name: "Отправить ещё раз" }));

    const input = (await screen.findByPlaceholderText("your@email.com")) as HTMLInputElement;
    expect(input.value).toBe("me@example.test");
    expect(server.publicCalls.filter(c => c.url.includes("resend"))).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: /Отправить письмо ещё раз/ }));
    await waitFor(() => expect(server.publicCalls.some(c => c.url === "/api/auth/resend-confirmation")).toBe(true));
    expect(server.publicCalls.at(-1)).toMatchObject({ body: { email: "me@example.test" } });
  });

  it("accepts a WordPress login instead of an email and does not prefill the resend form with it", async () => {
    renderRoutes(routes, ["/login"]);
    login("  wp_user_01 ");

    await waitFor(() => expect(server.publicCalls.some(c => c.url === "/api/auth/login")).toBe(true));
    expect(server.publicCalls.find(c => c.url === "/api/auth/login")).toMatchObject({ body: { email: "wp_user_01" } });
    fireEvent.click(await screen.findByRole("link", { name: "Отправить ещё раз" }));
    const input = (await screen.findByPlaceholderText("your@email.com")) as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it.each([
    ["429", { status: 429 } as const, /Слишком много попыток/],
    ["network", "network" as const, /Не удалось подключиться к серверу/],
  ])("%s on login → readable message and the same hint", async (_n, response, expected) => {
    server.publicResponses["/api/auth/login"] = response;
    renderRoutes(routes, ["/login"]);
    login();
    await screen.findByText(expected);
    expect(screen.getByRole("link", { name: "Отправить ещё раз" })).toBeTruthy();
  });
});
