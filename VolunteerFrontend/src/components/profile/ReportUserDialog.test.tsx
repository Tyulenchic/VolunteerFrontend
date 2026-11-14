import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { reportsApi } from "../../api/moderation";
import { NotificationProvider } from "../../context/NotificationContext";
import { ReportUserButton } from "./ReportUserDialog";

const renderButton = () => render(
  <NotificationProvider><ReportUserButton userId="u2" userName="Иван Петров" /></NotificationProvider>,
);

const errorResponse = (status: number, data: unknown) => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, { status, statusText: String(status), headers: {}, config, data });
};

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("ReportUserButton", () => {
  it("requires a reason before sending and sends the trimmed comment", async () => {
    const send = vi.spyOn(reportsApi, "reportUser").mockResolvedValue();
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: /Пожаловаться/ }));
    const submit = screen.getByRole("button", { name: "Отправить жалобу" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Выдаёт себя за другого" }));
    fireEvent.change(screen.getByLabelText(/Пояснение/), { target: { value: "  это не он  " } });
    fireEvent.click(submit);

    await waitFor(() => expect(send).toHaveBeenCalledWith("u2", "Impersonation", "это не он"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("shows why a duplicate report was refused and keeps the dialog open", async () => {
    vi.spyOn(reportsApi, "reportUser").mockRejectedValue(errorResponse(400, { error: "Вы уже подали жалобу на этого пользователя, она ещё рассматривается." }));
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: /Пожаловаться/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Другое" }));
    fireEvent.click(screen.getByRole("button", { name: "Отправить жалобу" }));

    expect((await screen.findByRole("alert")).textContent).toContain("уже подали жалобу");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("explains the daily limit in plain words", async () => {
    vi.spyOn(reportsApi, "reportUser").mockRejectedValue(errorResponse(429, { error: "Слишком много попыток.", code: "TooManyRequests" }));
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: /Пожаловаться/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Другое" }));
    fireEvent.click(screen.getByRole("button", { name: "Отправить жалобу" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/Слишком много попыток/);
  });
});
