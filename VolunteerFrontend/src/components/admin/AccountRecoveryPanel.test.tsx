import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { adminApi } from "../../api/admin";
import { NotificationProvider } from "../../context/NotificationContext";
import { ConfirmProvider } from "../ui/ConfirmDialog";
import { AccountRecoveryPanel } from "./AccountRecoveryPanel";

const domainError = (message: string) => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError("HTTP 400", AxiosError.ERR_BAD_REQUEST, config, {}, {
    status: 400, statusText: "400", headers: {}, config, data: { error: message, code: "DomainError" },
  });
};

const renderPanel = (props: Partial<{ isActive: boolean; onDone: () => void }> = {}) => render(
  <NotificationProvider>
    <ConfirmProvider>
      <AccountRecoveryPanel userId="u1" email="anna@example.org" isActive={props.isActive ?? true} onDone={props.onDone ?? (() => {})} />
    </ConfirmProvider>
  </NotificationProvider>,
);

const reason = () => screen.getByLabelText(/Основание/) as HTMLTextAreaElement;

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("AccountRecoveryPanel", () => {
  it("sends a reset link only with a reason and only once while the request runs", async () => {
    let finish: () => void = () => {};
    const send = vi.spyOn(adminApi, "sendPasswordReset").mockImplementation(() => new Promise<void>(r => { finish = r; }));
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /Ссылка для сброса пароля/ }));
    fireEvent.click(screen.getByRole("button", { name: "Отправить ссылку" }));
    expect(screen.getByRole("alert").textContent).toContain("Укажите основание");
    expect(send).not.toHaveBeenCalled();

    fireEvent.change(reason(), { target: { value: "  Письмо от 15.11  " } });
    const submit = screen.getByRole("button", { name: "Отправить ссылку" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("u1", "Письмо от 15.11");
    finish();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Отправить ссылку" })).toBeNull());
  });

  it("does not offer a reset link to a blocked user", () => {
    renderPanel({ isActive: false });

    expect((screen.getByRole("button", { name: /Ссылка для сброса пароля/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/после разблокировки/)).toBeTruthy();
  });

  it("changes the email after confirmation and shows the server's refusal", async () => {
    const change = vi.spyOn(adminApi, "changeUserEmail")
      .mockRejectedValueOnce(domainError("Этот email уже занят другим аккаунтом."))
      .mockResolvedValueOnce(undefined);
    const done = vi.fn();
    renderPanel({ onDone: done });

    fireEvent.click(screen.getByRole("button", { name: /Сменить email/ }));
    const email = screen.getByLabelText("Новый email");
    fireEvent.change(email, { target: { value: "ANNA@example.org" } });
    fireEvent.change(reason(), { target: { value: "Нет доступа к ящику" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Сменить email" }).at(-1)!);
    expect(screen.getByRole("alert").textContent).toContain("текущий email");

    fireEvent.change(email, { target: { value: " New@Example.org " } });
    const submitAndConfirm = async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Сменить email" }).at(-1)!);
      const dialog = await screen.findByRole("dialog");
      expect(dialog.textContent).toContain("anna@example.org → new@example.org");
      fireEvent.click(within(dialog).getByRole("button", { name: "Сменить email" }));
    };

    await submitAndConfirm();
    expect(await screen.findByText("Этот email уже занят другим аккаунтом.")).toBeTruthy();
    expect(done).not.toHaveBeenCalled();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await submitAndConfirm();
    await waitFor(() => expect(done).toHaveBeenCalledTimes(1));
    expect(change).toHaveBeenLastCalledWith("u1", "new@example.org", "Нет доступа к ящику");
  });
});
