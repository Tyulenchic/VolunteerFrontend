import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { feedbackApi, type FeedbackReply } from "../../api/feedback";
import { NotificationProvider } from "../../context/NotificationContext";
import { FeedbackReplyForm } from "./FeedbackReplyForm";

const sent: FeedbackReply = { id: "r1", message: "Приходите в субботу", adminId: "a1", adminName: "Анна Админ", createdAt: "2026-06-01T12:00:00Z" };

const httpError = (status: number, message: string) => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, {
    status, statusText: String(status), headers: {}, config, data: { error: message, code: "EmailDeliveryFailed" },
  });
};

const renderForm = (onSent = vi.fn(), onCancel = vi.fn()) => {
  render(<NotificationProvider><FeedbackReplyForm feedbackId="f1" email="guest@example.org" onSent={onSent} onCancel={onCancel} /></NotificationProvider>);
  return { onSent, onCancel };
};
const field = () => screen.getByLabelText(/Ответ/) as HTMLTextAreaElement;

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("FeedbackReplyForm", () => {
  it("tells where the letter goes and sends the trimmed text", async () => {
    const reply = vi.spyOn(feedbackApi, "reply").mockResolvedValue(sent);
    const { onSent } = renderForm();
    expect(screen.getByText(/с адреса сайта на/).textContent).toContain("guest@example.org");

    fireEvent.change(field(), { target: { value: "  Приходите в субботу  " } });
    fireEvent.click(screen.getByRole("button", { name: /Отправить ответ/ }));

    await waitFor(() => expect(onSent).toHaveBeenCalledWith(sent));
    expect(reply).toHaveBeenCalledWith("f1", "Приходите в субботу");
    expect(reply).toHaveBeenCalledTimes(1);
  });

  it("does not send an empty or too short answer", () => {
    const reply = vi.spyOn(feedbackApi, "reply").mockResolvedValue(sent);
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: /Отправить ответ/ }));
    expect(screen.getByRole("alert").textContent).toContain("Напишите ответ");
    fireEvent.change(field(), { target: { value: "   я   " } });
    fireEvent.click(screen.getByRole("button", { name: /Отправить ответ/ }));
    expect(screen.getByRole("alert").textContent).toContain("Напишите ответ");
    expect(reply).not.toHaveBeenCalled();
  });

  it("sends only once while the request runs", async () => {
    let finish: (r: FeedbackReply) => void = () => {};
    const reply = vi.spyOn(feedbackApi, "reply").mockImplementation(() => new Promise<FeedbackReply>(r => { finish = r; }));
    const { onSent } = renderForm();

    fireEvent.change(field(), { target: { value: "Приходите в субботу" } });
    const form = field().closest("form") as HTMLFormElement;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(reply).toHaveBeenCalledTimes(1);

    finish(sent);
    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
  });

  it("keeps the text and lets the administrator try again when the mail did not go out", async () => {
    const reply = vi.spyOn(feedbackApi, "reply")
      .mockRejectedValueOnce(httpError(503, "Не удалось отправить ответ на почту. Повторите попытку позже."))
      .mockResolvedValue(sent);
    const { onSent } = renderForm();

    fireEvent.change(field(), { target: { value: "Приходите в субботу" } });
    fireEvent.click(screen.getByRole("button", { name: /Отправить ответ/ }));

    expect((await screen.findByRole("alert")).textContent).toBeTruthy();
    expect(onSent).not.toHaveBeenCalled();
    expect(field().value).toBe("Приходите в субботу");

    fireEvent.click(screen.getByRole("button", { name: /Отправить ответ/ }));
    await waitFor(() => expect(onSent).toHaveBeenCalledWith(sent));
    expect(reply).toHaveBeenCalledTimes(2);
  });

  it("closes without sending when cancelled", () => {
    const reply = vi.spyOn(feedbackApi, "reply").mockResolvedValue(sent);
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(reply).not.toHaveBeenCalled();
  });
});
