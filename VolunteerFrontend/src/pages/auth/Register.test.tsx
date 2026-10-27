import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { RegisterPage } from "./RegisterPage";
import { RegisterModal } from "../home/AuthModals";
import { FakeServer } from "../../test/fakeServer";
import { renderRoutes } from "../../test/render";
import { getAccessToken, getRefreshToken } from "../../auth/session";

let server: FakeServer;
beforeEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); server = new FakeServer(); });

const fillAndSubmit = (password = "Passw0rd-123", email = "  new.user@example.test ") => {
  fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: email } });
  const passwords = screen.getAllByPlaceholderText("••••••••");
  fireEvent.change(passwords[0], { target: { value: password } });
  fireEvent.change(passwords[1], { target: { value: password } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));
};

/** Общие проверки для страницы и модального окна: 202 без токенов — пользователь НЕ авторизован. */
const expectCheckEmailState = async () => {
  await screen.findByText("Проверьте почту");
  expect(screen.getByText("Если адрес указан верно, на него отправлено письмо с подтверждением.")).toBeTruthy();
  expect(screen.getByPlaceholderText("your@email.com")).toBeTruthy(); // resend
  expect((screen.getByPlaceholderText("your@email.com") as HTMLInputElement).value).toBe("new.user@example.test");

  expect(server.publicCalls).toEqual([{
    url: "/api/auth/register",
    body: { email: "new.user@example.test", password: "Passw0rd-123", consentGiven: true },
    authorization: undefined,
  }]);
  // никаких /me и refresh, токены не сохраняются
  expect(server.requestLog).toEqual(["POST /api/auth/register"]);
  expect(getAccessToken()).toBeNull();
  expect(getRefreshToken()).toBeNull();
  expect(JSON.stringify({ ...localStorage })).not.toMatch(/undefined|null/);
};

describe("RegisterPage", () => {
  const routes = [{ path: "/register", element: <RegisterPage /> }, { path: "/profile", element: <div>PROFILE</div> }];

  it("202 → «Проверьте почту», not authenticated, no navigation to /profile", async () => {
    const { router } = renderRoutes(routes, ["/register"]);
    fillAndSubmit();
    await expectCheckEmailState();
    expect(router.state.location.pathname).toBe("/register");
    expect(screen.queryByText("PROFILE")).toBeNull();
  });

  it("rejects a password longer than 72 UTF-8 bytes without sending anything", async () => {
    renderRoutes(routes, ["/register"]);
    fillAndSubmit("ж".repeat(40));
    await screen.findByText(/слишком длинный/);
    expect(server.publicCalls).toEqual([]);
  });

  it("password fields use autocomplete=new-password", () => {
    renderRoutes(routes, ["/register"]);
    expect((screen.getAllByPlaceholderText("••••••••") as HTMLInputElement[]).map(i => i.autocomplete)).toEqual(["new-password", "new-password"]);
  });

  it("429 → neutral message instead of the success state", async () => {
    server.publicResponses["/api/auth/register"] = { status: 429 };
    renderRoutes(routes, ["/register"]);
    fillAndSubmit();
    await screen.findByText("Слишком много попыток. Попробуйте позже.");
    expect(screen.queryByText("Проверьте почту")).toBeNull();
  });

  it("400 validation shapes are shown as readable text, not as the technical title", async () => {
    server.publicResponses["/api/auth/register"] = { status: 400, data: { message: "Validation failed", errors: { ConsentGiven: ["Необходимо согласие."] } } };
    renderRoutes(routes, ["/register"]);
    fillAndSubmit();
    await screen.findByText("Необходимо согласие.");
    expect(screen.queryByText(/Validation failed/)).toBeNull();
  });
});

describe("HomePage RegisterModal", () => {
  const routes = [
    { path: "/", element: <RegisterModal onClose={() => {}} onSwitch={() => {}} /> },
    { path: "/profile", element: <div>PROFILE</div> },
  ];

  it("202 → «Проверьте почту», NOT «Регистрация успешна», no navigation, no /me, no tokens", async () => {
    const { router } = renderRoutes(routes, ["/"]);
    fillAndSubmit();
    await expectCheckEmailState();
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByText("PROFILE")).toBeNull();
    expect(screen.queryByText(/Регистрация успешна/)).toBeNull();
  });

  it("the modal form is replaced by the success state (no second submit)", async () => {
    renderRoutes(routes, ["/"]);
    fillAndSubmit();
    await screen.findByText("Проверьте почту");
    expect(screen.queryByRole("button", { name: "Создать аккаунт" })).toBeNull();
  });

  it("rejects a too-long password locally", async () => {
    renderRoutes(routes, ["/"]);
    fillAndSubmit("ж".repeat(40));
    await screen.findByText(/слишком длинный/);
    expect(server.publicCalls).toEqual([]);
  });
});
