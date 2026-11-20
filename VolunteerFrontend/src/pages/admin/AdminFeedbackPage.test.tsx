import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { feedbackApi, type FeedbackItem, type FeedbackReply } from "../../api/feedback";
import { ConfirmProvider } from "../../components/ui/ConfirmDialog";
import { NotificationProvider } from "../../context/NotificationContext";
import { AdminFeedbackPage } from "./AdminFeedbackPage";

const item = (over: Partial<FeedbackItem> = {}): FeedbackItem => ({
  id: "f1", name: "Ольга", email: "olga@example.org", message: "Хочу в волонтёры", userId: null,
  isRead: false, createdAt: "2026-06-01T12:00:00Z", readAt: null, replies: [], ...over,
});
const answer: FeedbackReply = { id: "r1", message: "Приходите в субботу", adminId: "a1", adminName: "Анна Админ", createdAt: "2026-06-01T13:00:00Z" };
const page = (items: FeedbackItem[]) => ({ items, totalCount: items.length, skip: 0, take: 15 });

const renderPage = () => render(
  <NotificationProvider><ConfirmProvider><MemoryRouter><AdminFeedbackPage /></MemoryRouter></ConfirmProvider></NotificationProvider>,
);

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("AdminFeedbackPage replies", () => {
  it("answers from the site: the form replaces the Gmail window and the answer appears under the message", async () => {
    vi.spyOn(feedbackApi, "list").mockResolvedValue(page([item()]));
    vi.spyOn(feedbackApi, "markRead").mockResolvedValue();
    const reply = vi.spyOn(feedbackApi, "reply").mockResolvedValue(answer);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Ольга/ }));
    expect(screen.queryByText(/Gmail/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Ответить$/ }));
    fireEvent.change(screen.getByLabelText(/Ответ/), { target: { value: "Приходите в субботу" } });
    fireEvent.click(screen.getByRole("button", { name: /Отправить ответ/ }));

    await waitFor(() => expect(reply).toHaveBeenCalledWith("f1", "Приходите в субботу"));
    const sent = await screen.findByRole("list", { name: "Отправленные ответы" });
    expect(within(sent).getByText("Приходите в субботу")).toBeTruthy();
    expect(within(sent).getByText(/Анна Админ/)).toBeTruthy();
    expect(screen.queryByLabelText(/Ответ/)).toBeNull();
    expect(screen.getByRole("button", { name: /^Ответить$/ })).toBeTruthy();
  });

  it("shows the answers that were sent earlier", async () => {
    vi.spyOn(feedbackApi, "list").mockResolvedValue(page([item({ isRead: true, replies: [answer] })]));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Ольга/ }));

    expect(within(screen.getByRole("list", { name: "Отправленные ответы" })).getByText("Приходите в субботу")).toBeTruthy();
  });
});
