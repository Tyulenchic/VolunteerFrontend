import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AboutPage } from "./AboutPage";
import { SiteFooter } from "../../components/afisha/SiteFooter";

vi.mock("../../context/FeedbackContext", () => ({ useFeedback: () => ({ openFeedback: vi.fn() }) }));

beforeEach(() => {
  cleanup();
  window.IntersectionObserver = window.IntersectionObserver ?? (class { observe() {} unobserve() {} disconnect() {} } as never);
});
afterEach(() => { vi.restoreAllMocks(); });

describe("AboutPage contacts", () => {
  it("shows the exact address from the footer, not only the city", () => {
    render(<MemoryRouter><AboutPage /></MemoryRouter>);

    expect(screen.getByText("г. Тирасполь, ул. Мира, 27")).toBeTruthy();
    expect(screen.getByText("Управление молодежной политики")).toBeTruthy();
  });

  it("has no link to VKontakte: volunteers have no page there", () => {
    const { container } = render(<MemoryRouter><AboutPage /></MemoryRouter>);

    expect(container.querySelector('a[href*="vk.com"]')).toBeNull();
    expect(screen.queryByLabelText("VK")).toBeNull();
    expect(screen.getByLabelText("Telegram")).toBeTruthy();
    expect(screen.getByLabelText("Instagram")).toBeTruthy();
  });
});

describe("SiteFooter", () => {
  it("has no link to VKontakte", () => {
    const { container } = render(<MemoryRouter><SiteFooter /></MemoryRouter>);

    expect(container.querySelector('a[href*="vk.com"]')).toBeNull();
    expect(screen.getByLabelText("Telegram")).toBeTruthy();
    expect(screen.getByText("г. Тирасполь, ул. Мира, 27")).toBeTruthy();
  });
});
