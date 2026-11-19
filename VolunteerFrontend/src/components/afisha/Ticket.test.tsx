import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { EventResponseDto } from "../../types/event";
import { resetEventCategories } from "../../utils/eventCategories";
import { Ticket } from "./Ticket";

const event: EventResponseDto = {
  id: "11111111-1111-1111-1111-111111111111", title: "Уборка набережной", description: "Описание", location: "Тирасполь, набережная",
  startsAt: "2026-06-02T10:00:00Z", endsAt: "2026-06-02T14:00:00Z", maxParticipants: 10, imageUrl: null, category: "Ecological", tags: ["эко"],
  approvedCount: 3, status: "Published", createdByUserId: "u1", createdAt: "2026-05-01T10:00:00Z", updatedAt: null,
};

const renderTicket = (e: EventResponseDto = event, onToggle = vi.fn(), onTag = vi.fn()) => {
  render(
    <MemoryRouter initialEntries={["/events"]}>
      <Routes>
        <Route path="/events" element={<Ticket e={e} onToggle={onToggle} onTag={onTag} />} />
        <Route path="/events/:id" element={<div>ПОДРОБНОСТИ</div>} />
      </Routes>
    </MemoryRouter>,
  );
  return { onToggle, onTag };
};

beforeEach(() => { cleanup(); resetEventCategories([]); });
afterEach(() => { vi.restoreAllMocks(); });

describe("Ticket", () => {
  it("opens the event page from any area of the ticket", () => {
    renderTicket();
    fireEvent.click(screen.getByRole("heading", { name: "Уборка набережной" }));
    expect(screen.getByText("ПОДРОБНОСТИ")).toBeTruthy();
  });

  it("opens the event page from the free-places area as well", () => {
    renderTicket();
    fireEvent.click(screen.getByText("Осталось"));
    expect(screen.getByText("ПОДРОБНОСТИ")).toBeTruthy();
  });

  it("keeps the apply button and the tags working without leaving the list", () => {
    const { onToggle, onTag } = renderTicket();

    fireEvent.click(screen.getByRole("button", { name: /Подать заявку/ }));
    expect(onToggle).toHaveBeenCalledWith(event);
    fireEvent.click(screen.getByRole("button", { name: "#эко" }));
    expect(onTag).toHaveBeenCalledWith("эко");

    expect(screen.queryByText("ПОДРОБНОСТИ")).toBeNull();
  });

  it("does not open the page when the user selects text on the ticket", () => {
    renderTicket();
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "Уборка" } as unknown as Selection);
    fireEvent.click(screen.getByRole("heading", { name: "Уборка набережной" }));
    expect(screen.queryByText("ПОДРОБНОСТИ")).toBeNull();
  });

  it("shows the name of a category added by an administrator", () => {
    resetEventCategories([{ value: "custom-0123456789ab", label: "Помощь соседям", builtIn: false }]);
    renderTicket({ ...event, category: "custom-0123456789ab" });
    expect(screen.getByText("Помощь соседям")).toBeTruthy();
  });
});
