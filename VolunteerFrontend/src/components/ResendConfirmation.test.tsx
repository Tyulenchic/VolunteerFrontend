import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ResendConfirmation, RESEND_COOLDOWN_SECONDS } from "./ResendConfirmation";
import { FakeServer } from "../test/fakeServer";

let server: FakeServer;
const URL = "/api/auth/resend-confirmation";

const emailInput = () => screen.getByPlaceholderText("your@email.com") as HTMLInputElement;
const button = () => screen.getByRole("button") as HTMLButtonElement;
const submit = () => fireEvent.click(button());

beforeEach(() => { cleanup(); localStorage.clear(); server = new FakeServer(); });
afterEach(() => { vi.useRealTimers(); });

describe("ResendConfirmation", () => {
  it("POSTs { email } trimmed, shows a neutral success message and starts a cooldown", async () => {
    render(<ResendConfirmation />);
    fireEvent.change(emailInput(), { target: { value: "  user@example.test  " } });
    submit();

    await screen.findByText(/Если этот адрес зарегистрирован/);
    expect(server.publicCalls).toEqual([{ url: URL, body: { email: "user@example.test" }, authorization: undefined }]);
    expect(button().disabled).toBe(true);
    expect(button().textContent).toContain(`${RESEND_COOLDOWN_SECONDS}`);
  });

  it("prefills the email and sends nothing automatically", () => {
    render(<ResendConfirmation initialEmail="prefilled@example.test" />);
    expect(emailInput().value).toBe("prefilled@example.test");
    expect(server.publicCalls).toEqual([]);
  });

  it("blocks repeated submits during the cooldown and allows another after it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<ResendConfirmation initialEmail="u@example.test" />);
    submit();
    await screen.findByText(/Если этот адрес зарегистрирован/);

    submit(); submit();
    fireEvent.submit(button().closest("form")!);
    expect(server.publicCalls.length).toBe(1);

    for (let i = 0; i < RESEND_COOLDOWN_SECONDS + 1; i++) await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); // тик = ререндер
    await waitFor(() => expect(button().disabled).toBe(false));
    submit();
    await waitFor(() => expect(server.publicCalls.length).toBe(2));
  });

  it("does not send a second request while the first is in flight", async () => {
    render(<ResendConfirmation initialEmail="u@example.test" />);
    const form = button().closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await screen.findByText(/Если этот адрес зарегистрирован/);
    expect(server.publicCalls.length).toBe(1);
  });

  it("429 → neutral Russian message and a cooldown (no English technical text)", async () => {
    server.publicResponses[URL] = { status: 429, data: { error: "Too many requests for this email" } };
    render(<ResendConfirmation initialEmail="u@example.test" />);
    submit();

    await screen.findByText("Слишком много попыток. Попробуйте позже.");
    expect(screen.queryByText(/Too many requests/)).toBeNull();
    expect(button().disabled).toBe(true);
  });

  it("network error → connection message, no success text, retry allowed", async () => {
    server.publicResponses[URL] = "network";
    render(<ResendConfirmation initialEmail="u@example.test" />);
    submit();

    await screen.findByText(/Не удалось подключиться к серверу/);
    expect(screen.queryByText(/Если этот адрес зарегистрирован/)).toBeNull();
    expect(button().disabled).toBe(false);
  });
});
