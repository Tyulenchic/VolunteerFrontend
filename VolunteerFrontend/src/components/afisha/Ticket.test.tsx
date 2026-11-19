import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { EventResponseDto } from "../../types/event";
import { resetEventCategories } from "../../utils/eventCategories";
import { Ticket } from "./Ticket";

const event: EventResponseDto = {
  id: "11111111-1111-1111-1111-111111111111", title: "Уборка набережной", description: "Описание", location: "Тирасполь, набережная",
  startsAt: "2026-06-02T10:00:00Z", endsAt: "2026-06-02T14:00:00Z", maxParticipants: 10, imageUrl: null, category: "Ecological", tags: ["эко"],
  approvedCount: 3, status: "Published", createdByUserId: "u1", createdAt: "2026-05-01T10:00:00Z", updatedAt: null,
};

const renderTicket = (e: EventResponseDto = event) => {
  render(<MemoryRouter><Ticket e={e} onToggle={vi.fn()} /></MemoryRouter>);
};

beforeEach(() => { cleanup(); resetEventCategories([]); });
afterEach(() => { vi.restoreAllMocks(); });

describe("Ticket", () => {
  it("shows the name of a built-in category", () => {
    renderTicket();
    expect(screen.getByText("Экологическое")).toBeTruthy();
  });

  it("shows the name of a category added by an administrator", () => {
    resetEventCategories([{ value: "custom-0123456789ab", label: "Помощь соседям", builtIn: false }]);
    renderTicket({ ...event, category: "custom-0123456789ab" });
    expect(screen.getByText("Помощь соседям")).toBeTruthy();
  });
});
