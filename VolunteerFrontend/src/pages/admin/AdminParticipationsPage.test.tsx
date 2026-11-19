import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { adminApi } from "../../api/admin";
import { ConfirmProvider } from "../../components/ui/ConfirmDialog";
import { NotificationProvider } from "../../context/NotificationContext";
import type { AdminParticipationDto } from "../../types/admin";
import { AdminParticipationsPage } from "./AdminParticipationsPage";

const USER = "33333333-3333-3333-3333-333333333333";

const application: AdminParticipationDto = {
  id: "p1", userId: USER, userName: "Ирина Петрова", userEmail: "irina@example.org", eventTitle: "Уборка набережной",
  createdAt: "2026-06-01T12:00:00Z", status: "Pending",
};

const renderPage = () => {
  vi.spyOn(adminApi, "getParticipations").mockResolvedValue({ Items: [application], Total: 1 } as never);
  render(
    <NotificationProvider><ConfirmProvider><MemoryRouter><AdminParticipationsPage /></MemoryRouter></ConfirmProvider></NotificationProvider>,
  );
};

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("AdminParticipationsPage: volunteer profile", () => {
  it("links the volunteer's name and the profile button to the profile in a new tab", async () => {
    renderPage();

    const name = await screen.findByRole("link", { name: "Ирина Петрова" });
    expect(name.getAttribute("href")).toBe(`/users/${USER}`);
    expect(name.getAttribute("target")).toBe("_blank");
    const button = screen.getByRole("link", { name: "Профиль: Ирина Петрова" });
    expect(button.getAttribute("href")).toBe(`/users/${USER}`);
  });

  it("offers the profile while the administrator reviews the application", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Одобрить/ }));

    const dialog = await screen.findByRole("dialog");
    const profile = within(dialog).getByRole("link", { name: /Открыть профиль волонтёра/ });
    expect(profile.getAttribute("href")).toBe(`/users/${USER}`);
    expect(profile.getAttribute("target")).toBe("_blank");
  });
});
