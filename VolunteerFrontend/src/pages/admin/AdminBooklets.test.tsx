import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { bookletAdminApi } from "../../api/booklet";
import { NotificationProvider } from "../../context/NotificationContext";
import type { BookletDto, BookletImportReport, BookletRequestDto } from "../../types/booklet";
import { AdminBookletsPage } from "./AdminBookletsPage";

const auth = vi.hoisted(() => ({ system: true }));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ isSystemAdmin: auth.system, canUse: () => true }),
}));

const request = (over: Partial<BookletRequestDto> = {}): BookletRequestDto => ({
  id: "r1", status: "Pending", lastName: "Петрова", firstName: "Анна", middleName: "Ивановна", birthYear: 2004, phone: "+37377712345",
  comment: null, hasPhoto: false, photoUrl: null, createdAt: "2026-06-01T12:00:00Z", handledAt: null, adminNote: null, bookletLabel: null,
  userId: "u1", accountEmail: "anna@example.org", bookletId: null, ...over,
});
const booklet = (over: Partial<BookletDto> = {}): BookletDto => ({
  id: "b1", number: 414, label: "V-00414", lastName: "Петрова", firstName: "Анна", middleName: null, birthYear: 2004, issuedAt: "2026-11-20",
  hasPhoto: false, photoUrl: null, version: 1, createdAt: "2026-11-20T10:00:00Z", updatedAt: null, userId: "u1", accountEmail: "anna@example.org", accountName: "Анна Петрова", ...over,
});

beforeEach(() => {
  cleanup();
  auth.system = true;
  vi.spyOn(bookletAdminApi, "requests").mockResolvedValue({ items: [request()], total: 1, pending: 1 });
  vi.spyOn(bookletAdminApi, "search").mockResolvedValue({ items: [booklet()], total: 1 });
});
afterEach(() => { vi.restoreAllMocks(); });

const renderPage = () => render(<NotificationProvider><AdminBookletsPage /></NotificationProvider>);

describe("AdminBookletsPage", () => {
  it("lists the requests that wait for a decision and counts them on the tab", async () => {
    renderPage();

    expect(await screen.findByText("Петрова Анна Ивановна")).toBeTruthy();
    expect(bookletAdminApi.requests).toHaveBeenCalledWith("Pending", 0, 20);
    expect(screen.getByRole("button", { name: "Рассмотреть" })).toBeTruthy();
    await waitFor(() => expect(within(screen.getByRole("button", { name: /Заявки/ })).getByText("1")).toBeTruthy());
  });

  it("issues the booklet from the request, with the number typed by the administrator", async () => {
    vi.spyOn(bookletAdminApi, "request").mockResolvedValue({ ...request(), sameBooklets: [], sameAccounts: [], suggestedNumber: 415, suggestedLabel: "V-00415" });
    const issue = vi.spyOn(bookletAdminApi, "issue").mockResolvedValue(booklet());
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Рассмотреть" }));

    const number = await screen.findByLabelText(/Номер книжки/);
    expect((number as HTMLInputElement).placeholder).toBe("V-00415");
    fireEvent.change(number, { target: { value: "V-00414" } });
    fireEvent.change(screen.getByLabelText(/Дата выдачи/), { target: { value: "2026-11-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Выдать книжку" }));

    await waitFor(() => expect(issue).toHaveBeenCalledWith("r1", "V-00414", "2026-11-20"));
  });

  it("without a typed number the server chooses one", async () => {
    vi.spyOn(bookletAdminApi, "request").mockResolvedValue({ ...request(), sameBooklets: [], sameAccounts: [], suggestedNumber: 415, suggestedLabel: "V-00415" });
    const issue = vi.spyOn(bookletAdminApi, "issue").mockResolvedValue(booklet());
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Рассмотреть" }));
    await screen.findByLabelText(/Номер книжки/);

    fireEvent.click(screen.getByRole("button", { name: "Выдать книжку" }));

    await waitFor(() => expect(issue).toHaveBeenCalledWith("r1", null, null));
  });

  it("warns about the same person's booklet and shows a refusal of the server", async () => {
    vi.spyOn(bookletAdminApi, "request").mockResolvedValue({ ...request(), sameBooklets: [booklet()], sameAccounts: [], suggestedNumber: 415, suggestedLabel: "V-00415" });
    vi.spyOn(bookletAdminApi, "issue").mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { error: "Номер V-00414 уже занят." } } });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Рассмотреть" }));

    expect((await screen.findAllByRole("alert"))[0].textContent).toContain("уже есть книжка: V-00414");
    fireEvent.click(screen.getByRole("button", { name: "Выдать книжку" }));
    await waitFor(() => expect(screen.getAllByRole("alert").length).toBeGreaterThan(1));
  });

  it("rejects a request with a reason that the volunteer will see", async () => {
    vi.spyOn(bookletAdminApi, "request").mockResolvedValue({ ...request(), sameBooklets: [], sameAccounts: [], suggestedNumber: 1, suggestedLabel: "V-001" });
    const reject = vi.spyOn(bookletAdminApi, "reject").mockResolvedValue();
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Рассмотреть" }));

    fireEvent.click(await screen.findByRole("button", { name: "Отклонить…" }));
    fireEvent.change(screen.getByLabelText(/Причина/), { target: { value: "Неверный год" } });
    fireEvent.click(screen.getByRole("button", { name: "Отклонить заявку" }));

    await waitFor(() => expect(reject).toHaveBeenCalledWith("r1", "Неверный год"));
  });

  it("searches booklets by number or name (the api layer trims the text)", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Книжки/ }));
    expect(await screen.findByText("V-00414")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Поиск по номеру или ФИО"), { target: { value: "  петр " } });

    await waitFor(() => expect(bookletAdminApi.search).toHaveBeenLastCalledWith("  петр ", null, 0, 20));
  });

  it("opens a booklet: print, and the number is editable for a system administrator only", async () => {
    const details = { ...booklet(), sameBooklets: [], freeAccounts: [] };
    vi.spyOn(bookletAdminApi, "get").mockResolvedValue(details);
    const openPdf = vi.spyOn(bookletAdminApi, "openPdf").mockResolvedValue();
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Книжки/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Открыть" }));

    expect(await screen.findByRole("button", { name: "Изменить номер" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Печать/ }));
    await waitFor(() => expect(openPdf).toHaveBeenCalledWith("b1"));

    cleanup();
    auth.system = false;
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Книжки/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Открыть" }));
    expect(await screen.findByText(/Менять номер может только системный администратор/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Изменить номер" })).toBeNull();
  });

  it("changes the number and shows the refusal for a taken one", async () => {
    vi.spyOn(bookletAdminApi, "get").mockResolvedValue({ ...booklet(), sameBooklets: [], freeAccounts: [] });
    const change = vi.spyOn(bookletAdminApi, "changeNumber").mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { error: "Номер V-00500 уже занят: Сидоров Борис." } } });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Книжки/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Открыть" }));

    fireEvent.change(await screen.findByLabelText(/V-00 и число/), { target: { value: "V-00500" } });
    fireEvent.click(screen.getByRole("button", { name: "Изменить номер" }));

    await waitFor(() => expect(change).toHaveBeenCalledWith("b1", "V-00500"));
    expect((await screen.findByRole("alert")).textContent).toContain("Номер V-00500 уже занят");
  });
});

describe("CSV import window", () => {
  const report = (over: Partial<BookletImportReport> = {}): BookletImportReport => ({
    dryRun: true, lines: 4, created: 2, skipped: [{ line: 5, reason: "Книжка V-00300 этого человека уже есть, строка пропущена." }],
    conflicts: [{ line: 4, reason: "Номер V-00300 уже занят другим человеком." }], fixes: [{ line: 2, field: "Номер", from: "v 00414", to: "V-00414" }],
    errors: [{ line: 6, reason: "Не указан номер книжки." }], notes: [], ...over,
  });

  it("checks the file first, shows what was fixed and what clashes, and loads only after the check", async () => {
    const importCsv = vi.spyOn(bookletAdminApi, "importCsv").mockResolvedValueOnce(report()).mockResolvedValueOnce(report({ dryRun: false }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Загрузить CSV/ }));

    const load = await screen.findByRole("button", { name: "Загрузить" });
    expect((load as HTMLButtonElement).disabled).toBe(true);
    const file = new File(["Номер;Фамилия\n"], "booklets.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("Файл CSV"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Проверить" }));

    expect(await screen.findByText(/ничего не записано/)).toBeTruthy();
    expect(screen.getByText(/«v 00414» → «V-00414»/)).toBeTruthy();
    expect(screen.getByText(/Номер V-00300 уже занят другим человеком/)).toBeTruthy();
    expect(importCsv).toHaveBeenLastCalledWith(file, true);

    fireEvent.click(screen.getByRole("button", { name: "Загрузить" }));
    await waitFor(() => expect(importCsv).toHaveBeenLastCalledWith(file, false));
    expect(await screen.findByText(/Загрузка выполнена/)).toBeTruthy();
  });

  it("does not take a file over two megabytes", async () => {
    const importCsv = vi.spyOn(bookletAdminApi, "importCsv");
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Загрузить CSV/ }));
    const big = new File(["x"], "big.csv", { type: "text/csv" });
    Object.defineProperty(big, "size", { value: 3_000_000 });

    fireEvent.change(await screen.findByLabelText("Файл CSV"), { target: { files: [big] } });

    expect((await screen.findByRole("alert")).textContent).toContain("2 МБ");
    expect((screen.getByRole("button", { name: "Проверить" }) as HTMLButtonElement).disabled).toBe(true);
    expect(importCsv).not.toHaveBeenCalled();
  });
});
