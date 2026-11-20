import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { systemApi, type RequestLogPage } from "../../api/system";
import { countByClass, statusTone } from "../../utils/requestLog";
import { AdminRequestLogPage } from "./AdminRequestLogPage";

const row = (id: number, status: number, path = "/api/events/actual", over = {}) => ({
  id, createdAt: "2026-06-01T12:00:00Z", method: "GET", path, status, durationMs: 12, userId: null, ip: "127.0.0.1", ...over,
});
const page = (items = [row(3, 500, "/api/boom"), row(2, 404), row(1, 200)]): RequestLogPage => ({
  items, total: items.length, statuses: { "200": 7, "201": 2, "404": 3, "500": 1 },
});

let get: ReturnType<typeof vi.spyOn>;
beforeEach(() => { cleanup(); get = vi.spyOn(systemApi, "getRequests").mockResolvedValue(page()); });
afterEach(() => { vi.restoreAllMocks(); });

const lastParams = () => get.mock.calls.at(-1)![0];

describe("request log helpers", () => {
  it("groups numbers into classes and picks a colour", () => {
    expect(countByClass({ "200": 7, "201": 2, "404": 3, "500": 1, "302": 4 })).toEqual({ 2: 9, 3: 4, 4: 3, 5: 1 });
    expect([statusTone(200), statusTone(302), statusTone(404), statusTone(500)]).toEqual(["success", "neutral", "warning", "error"]);
  });
});

describe("AdminRequestLogPage", () => {
  it("shows the rows with their numbers and counts of every class", async () => {
    render(<AdminRequestLogPage />);

    expect(await screen.findByText("/api/boom")).toBeTruthy();
    const table = screen.getByRole("table");
    expect(within(table).getByText("500")).toBeTruthy();
    expect(within(table).getByText("404")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Успешные 2xx \(9\)/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ошибки запроса 4xx \(3\)/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ошибки сервера 5xx \(1\)/ })).toBeTruthy();
    expect(lastParams()).toMatchObject({ sort: "time", order: "desc", skip: 0, take: 50 });
  });

  it("filters by class, then by an exact number from the list", async () => {
    render(<AdminRequestLogPage />);
    await screen.findByText("/api/boom");

    fireEvent.click(screen.getByRole("button", { name: /Ошибки запроса 4xx/ }));
    await waitFor(() => expect(lastParams()).toMatchObject({ statusClass: 4 }));

    fireEvent.change(screen.getByLabelText("Точный номер ответа"), { target: { value: "500" } });
    await waitFor(() => expect(lastParams()).toMatchObject({ status: 500 }));
    expect(lastParams()).not.toHaveProperty("statusClass");
    expect(screen.getByRole("option", { name: /404 — Не найдено \(3\)/ })).toBeTruthy();
  });

  it("sends method, part of the address, dates, slow only and the chosen order", async () => {
    render(<AdminRequestLogPage />);
    await screen.findByText("/api/boom");

    fireEvent.change(screen.getByLabelText("Часть адреса"), { target: { value: "/api/events" } });
    fireEvent.change(screen.getByLabelText("Метод"), { target: { value: "POST" } });
    fireEvent.change(screen.getByLabelText("С даты"), { target: { value: "2026-05-30" } });
    fireEvent.change(screen.getByLabelText("По дату"), { target: { value: "2026-06-01" } });
    fireEvent.click(screen.getByLabelText(/Только медленные/));
    fireEvent.change(screen.getByLabelText("Порядок"), { target: { value: "status-desc" } });

    await waitFor(() => expect(lastParams()).toMatchObject({
      path: "/api/events", method: "POST", from: "2026-05-30", to: "2026-06-01", slowerThanMs: 1000, sort: "status", order: "desc",
    }));
  });

  it("explains an empty answer for filters and resets them", async () => {
    render(<AdminRequestLogPage />);
    await screen.findByText("/api/boom");
    get.mockResolvedValue({ items: [], total: 0, statuses: {} });

    fireEvent.click(screen.getByLabelText(/Только медленные/));

    expect(await screen.findByText("Под эти условия записей нет")).toBeTruthy();
    get.mockResolvedValue(page());
    fireEvent.click(screen.getAllByRole("button", { name: /Показать все|Сбросить/ })[0]);
    expect(await screen.findByText("/api/boom")).toBeTruthy();
    expect(lastParams()).not.toHaveProperty("slowerThanMs");
  });

  it("shows an error with a retry when the log cannot be loaded", async () => {
    get.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<AdminRequestLogPage />);

    expect(await screen.findByText("Не удалось загрузить журнал запросов")).toBeTruthy();
  });
});
