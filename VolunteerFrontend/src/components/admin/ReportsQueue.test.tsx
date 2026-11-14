import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { MemoryRouter } from "react-router-dom";
import { reportsApi, type ContentReport } from "../../api/moderation";
import { NotificationProvider } from "../../context/NotificationContext";
import { ReportsQueue } from "./ReportsQueue";

const report: ContentReport = {
  id: "r1", reporterUserId: "u1", targetUserId: "u2", targetDisplayName: "Иван Петров",
  reason: "InappropriateName", comment: "грубое имя", status: "Open", resolution: null,
  resolutionNote: null, createdAt: "2026-06-01T12:00:00Z", resolvedAt: null,
};

const page = (items: ContentReport[]) => ({ items, totalCount: items.length, skip: 0, take: 20 });

const domainError = (message: string) => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError("HTTP 400", AxiosError.ERR_BAD_REQUEST, config, {}, {
    status: 400, statusText: "400", headers: {}, config, data: { error: message, code: "DomainError" },
  });
};

const renderQueue = (onOpenCountChange?: (n: number) => void) => render(
  <NotificationProvider>
    <MemoryRouter><ReportsQueue onOpenCountChange={onOpenCountChange} /></MemoryRouter>
  </NotificationProvider>,
);

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("ReportsQueue", () => {
  it("lists open reports first and reports the open count for the tab badge", async () => {
    const list = vi.spyOn(reportsApi, "list").mockResolvedValue(page([report]));
    const counted = vi.fn();
    renderQueue(counted);

    expect(await screen.findByText("Иван Петров")).toBeTruthy();
    expect(screen.getByText("Недопустимое имя")).toBeTruthy();
    expect(screen.getByText("«грубое имя»")).toBeTruthy();
    expect(list).toHaveBeenCalledWith("Open", 0, 20);
    expect(counted).toHaveBeenCalledWith(1);
  });

  it("resolves a report with the chosen measure and note, then reloads the queue", async () => {
    vi.spyOn(reportsApi, "list").mockResolvedValueOnce(page([report])).mockResolvedValue(page([]));
    const resolve = vi.spyOn(reportsApi, "resolve").mockResolvedValue();
    renderQueue();

    fireEvent.click(await screen.findByRole("button", { name: /Рассмотреть/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Заблокировать/ }));
    fireEvent.change(screen.getByLabelText(/Заметка модератора/), { target: { value: "  спам  " } });
    fireEvent.click(screen.getByRole("button", { name: "Применить меру и закрыть" }));

    await waitFor(() => expect(resolve).toHaveBeenCalledWith("r1", "BlockUser", "спам"));
    expect(await screen.findByText("Открытых жалоб нет")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the dialog open and shows the server reason when the measure is not applicable", async () => {
    vi.spyOn(reportsApi, "list").mockResolvedValue(page([report]));
    vi.spyOn(reportsApi, "resolve").mockRejectedValue(domainError("У пользователя нет аватара."));
    renderQueue();

    fireEvent.click(await screen.findByRole("button", { name: /Рассмотреть/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Удалить фото/ }));
    fireEvent.click(screen.getByRole("button", { name: "Применить меру и закрыть" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("dismissing sends no note when the note is empty", async () => {
    vi.spyOn(reportsApi, "list").mockResolvedValue(page([report]));
    const resolve = vi.spyOn(reportsApi, "resolve").mockResolvedValue();
    renderQueue();

    fireEvent.click(await screen.findByRole("button", { name: /Рассмотреть/ }));
    fireEvent.click(screen.getByRole("button", { name: "Закрыть без мер" }));

    await waitFor(() => expect(resolve).toHaveBeenCalledWith("r1", "Dismiss", null));
  });
});
