import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { authApi } from "../../api/auth";
import { NotificationProvider } from "../../context/NotificationContext";
import type { SessionDto } from "../../types/auth";
import { SessionsPanel } from "./SessionsPanel";

const LAPTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";
const PHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

const session = (id: string, current: boolean, userAgent: string): SessionDto => ({
  id, current, userAgent, ipAddress: "10.0.0.5",
  startedAt: "2026-06-01T12:00:00Z", lastActiveAt: "2026-06-01T12:30:00Z", expiresAt: "2026-12-01T12:00:00Z",
});

const domainError = (message: string) => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError("HTTP 400", AxiosError.ERR_BAD_REQUEST, config, {}, {
    status: 400, statusText: "400", headers: {}, config, data: { error: message, code: "DomainError" },
  });
};

const renderPanel = () => render(<NotificationProvider><SessionsPanel /></NotificationProvider>);
const dialog = () => screen.getByRole("dialog");

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("SessionsPanel", () => {
  it("lists the devices and offers no way to end the current session", async () => {
    vi.spyOn(authApi, "listSessions").mockResolvedValue([session("s1", true, LAPTOP), session("s2", false, PHONE)]);
    renderPanel();

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Chrome на Windows")).toBeTruthy();
    expect(within(items[0]).getByText("Это устройство")).toBeTruthy();
    expect(within(items[0]).queryByRole("button")).toBeNull();
    expect(within(items[0]).getByText(/Текущий сеанс завершить нельзя/)).toBeTruthy();
    expect(within(items[1]).getByText("Safari на iOS")).toBeTruthy();
    expect(within(items[1]).getByRole("button", { name: "Завершить сеанс: Safari на iOS" })).toBeTruthy();
  });

  it("ends another session only after confirmation and then reloads the list", async () => {
    const list = vi.spyOn(authApi, "listSessions")
      .mockResolvedValueOnce([session("s1", true, LAPTOP), session("s2", false, PHONE)])
      .mockResolvedValue([session("s1", true, LAPTOP)]);
    const end = vi.spyOn(authApi, "endSession").mockResolvedValue();
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Завершить сеанс: Safari на iOS" }));
    expect(within(dialog()).getByText(/Safari на iOS/)).toBeTruthy();
    expect(end).not.toHaveBeenCalled();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Завершить" }));

    await waitFor(() => expect(end).toHaveBeenCalledWith("s2"));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
    expect(list).toHaveBeenCalledTimes(2);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the confirmation is cancelled", async () => {
    vi.spyOn(authApi, "listSessions").mockResolvedValue([session("s1", true, LAPTOP), session("s2", false, PHONE)]);
    const end = vi.spyOn(authApi, "endSession").mockResolvedValue();
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Завершить сеанс: Safari на iOS" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Отмена" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(end).not.toHaveBeenCalled();
  });

  it("ends all the other sessions at once and keeps this one", async () => {
    vi.spyOn(authApi, "listSessions")
      .mockResolvedValueOnce([session("s1", true, LAPTOP), session("s2", false, PHONE), session("s3", false, PHONE)])
      .mockResolvedValue([session("s1", true, LAPTOP)]);
    const all = vi.spyOn(authApi, "endOtherSessions").mockResolvedValue(2);
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Завершить все остальные сеансы" }));
    expect(within(dialog()).getByText(/\(2\)\. Этот сеанс останется/)).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Завершить все" }));

    await waitFor(() => expect(all).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
    expect((screen.getByRole("button", { name: "Завершить все остальные сеансы" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("has nothing to end when this is the only device", async () => {
    vi.spyOn(authApi, "listSessions").mockResolvedValue([session("s1", true, LAPTOP)]);
    const all = vi.spyOn(authApi, "endOtherSessions").mockResolvedValue(0);
    renderPanel();

    const button = await screen.findByRole("button", { name: "Завершить все остальные сеансы" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(all).not.toHaveBeenCalled();
    expect(screen.getByText(/Других устройств, где вы вошли, нет/)).toBeTruthy();
  });

  it("shows the reason when the server refuses and reloads the list", async () => {
    const list = vi.spyOn(authApi, "listSessions").mockResolvedValue([session("s1", true, LAPTOP), session("s2", false, PHONE)]);
    vi.spyOn(authApi, "endSession").mockRejectedValue(domainError("Сеанс не найден или уже завершён."));
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Завершить сеанс: Safari на iOS" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Завершить" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Сеанс не найден или уже завершён.");
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });
});
