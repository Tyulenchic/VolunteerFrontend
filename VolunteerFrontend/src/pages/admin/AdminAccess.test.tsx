import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { adminApi } from "../../api/admin";
import { feedbackApi } from "../../api/feedback";
import { AdminAccessPanel } from "../../components/admin/AdminAccessPanel";
import { NotificationProvider } from "../../context/NotificationContext";
import { canUseSection } from "../../utils/adminSections";
import { AdminLayout } from "./AdminLayout";

const auth = vi.hoisted(() => ({ sections: null as string[] | null }));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "me", role: "Admin", firstName: "Анна", lastName: "Админова", email: "a@x.test", adminSections: auth.sections },
    logout: vi.fn(),
    isSystemAdmin: auth.sections === null,
    canUse: (key: string) => auth.sections === null || auth.sections.includes(key),
  }),
}));
vi.mock("../../components/ui/NotificationBell", () => ({ NotificationBell: () => null }));

beforeEach(() => {
  cleanup();
  auth.sections = null;
  vi.spyOn(feedbackApi, "unreadCount").mockResolvedValue({ unreadCount: 0 });
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: true, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList);
});
afterEach(() => { vi.restoreAllMocks(); });

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;
const renderLayout = (path = "/admin") => render(
  <NotificationProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/profile" element={<div>PROFILE</div>} />
        <Route path="/admin/*" element={<AdminLayout><Where /></AdminLayout>} />
      </Routes>
    </MemoryRouter>
  </NotificationProvider>,
);
const navLabels = () => within(screen.getByLabelText("Навигация администратора").querySelector("nav") as HTMLElement).queryAllByRole("link", { hidden: true }).map(a => a.textContent?.trim());

describe("canUseSection", () => {
  it("everything for a system administrator, only the ticked sections for an administrator of content", () => {
    expect(canUseSection(null, "news")).toBe(true);
    expect(canUseSection(undefined, "news")).toBe(true);
    expect(canUseSection(["news"], "news")).toBe(true);
    expect(canUseSection(["news"], "users")).toBe(false);
    expect(canUseSection([], "news")).toBe(false);
  });
});

describe("AdminLayout menu", () => {
  it("a system administrator sees every group including the system pages", () => {
    renderLayout();
    const labels = navLabels();
    expect(labels).toEqual(expect.arrayContaining(["Дашборд", "Новости", "Состояние системы", "Журнал действий", "База данных"]));
  });

  it("an administrator of content sees only the ticked sections and no system pages", () => {
    auth.sections = ["news", "events"];
    renderLayout("/admin/news");
    const labels = navLabels();
    expect(labels).toEqual(["Мероприятия", "Новости"]);
    expect(screen.queryByText("Состояние системы")).toBeNull();
    expect(screen.queryByText("Платформа")).toBeTruthy();
    expect(screen.queryByText("Обзор")).toBeNull();
    expect(screen.queryByText("Система")).toBeNull();
  });

  it("a closed page that is opened by a direct link leads to the first open section", () => {
    auth.sections = ["news"];
    renderLayout("/admin/database");
    expect(screen.getByTestId("where").textContent).toBe("/admin/news");
  });

  it("a page that is open stays open", () => {
    auth.sections = ["news"];
    renderLayout("/admin/news");
    expect(screen.getByTestId("where").textContent).toBe("/admin/news");
  });
});

describe("AdminAccessPanel", () => {
  const renderPanel = (initial: string[] | null, onSaved = vi.fn()) => {
    render(<NotificationProvider><AdminAccessPanel userId="u1" initial={initial} onSaved={onSaved} /></NotificationProvider>);
    return onSaved;
  };

  it("makes an administrator of content from the ticked sections, in the order of the menu", async () => {
    const save = vi.spyOn(adminApi, "setAdminSections").mockResolvedValue({ adminSections: ["events", "news"] });
    const onSaved = renderPanel(null);
    expect((screen.getByRole("button", { name: "Сохранить права" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByLabelText(/Администратор контента/));
    fireEvent.click(screen.getByLabelText(/^Новости/));
    fireEvent.click(screen.getByLabelText(/^Мероприятия/));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить права" }));

    await waitFor(() => expect(save).toHaveBeenCalledWith("u1", ["events", "news"]));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(["events", "news"]));
  });

  it("returns full access with the system administrator choice", async () => {
    const save = vi.spyOn(adminApi, "setAdminSections").mockResolvedValue({ adminSections: null });
    renderPanel(["news"]);

    expect((screen.getByLabelText(/^Новости/) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByLabelText(/Системный администратор/));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить права" }));

    await waitFor(() => expect(save).toHaveBeenCalledWith("u1", null));
  });

  it("warns when nothing is ticked and shows a refusal of the server", async () => {
    vi.spyOn(adminApi, "setAdminSections").mockRejectedValue(new Error("boom"));
    renderPanel(["news"]);

    fireEvent.click(screen.getByLabelText(/^Новости/));
    expect(screen.getByText(/Ни один раздел не отмечен/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Сохранить права" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Не удалось сохранить права");
  });
});
