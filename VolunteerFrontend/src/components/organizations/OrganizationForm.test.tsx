import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { organizationsApi } from "../../api/organizations";
import type { OrganizationDetails } from "../../types/organization";
import { OrganizationForm } from "./OrganizationForm";

const saved = { id: "o1", name: "Экодобро" } as OrganizationDetails;

const fill = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
const fillRequired = () => {
  fill("org-name", "Экодобро");
  fireEvent.change(document.getElementById("org-desc") as HTMLTextAreaElement, { target: { value: "Помогаем природе" } });
};

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("OrganizationForm: address, social links and the join form", () => {
  it("sends the address, the four social links and the link to the join form", async () => {
    const create = vi.spyOn(organizationsApi, "create").mockResolvedValue(saved);
    const onSaved = vi.fn();
    render(<OrganizationForm onSaved={onSaved} />);
    fillRequired();
    fill("org-address", "  ул. Ленина, 12, офис 3 ");
    fill("org-telegram", "@ecodobro");
    fill("org-instagram", "https://instagram.com/ecodobro");
    fill("org-facebook", "https://facebook.com/ecodobro");
    fill("org-vk", "https://vk.com/ecodobro");
    fill("org-join", "https://forms.gle/abc123");

    fireEvent.click(screen.getByRole("button", { name: /Создать|Сохранить/ }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(create.mock.calls[0][0]).toMatchObject({
      address: "ул. Ленина, 12, офис 3", telegramUrl: "@ecodobro", instagramUrl: "https://instagram.com/ecodobro",
      facebookUrl: "https://facebook.com/ecodobro", vkUrl: "https://vk.com/ecodobro", joinFormUrl: "https://forms.gle/abc123",
    });
  });

  it("leaves the optional fields empty (null) when nothing is typed", async () => {
    const create = vi.spyOn(organizationsApi, "create").mockResolvedValue(saved);
    render(<OrganizationForm onSaved={vi.fn()} />);
    fillRequired();

    fireEvent.click(screen.getByRole("button", { name: /Создать|Сохранить/ }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ address: null, facebookUrl: null, telegramUrl: null, instagramUrl: null, vkUrl: null, joinFormUrl: null });
  });

  it("does not send a link that is not http(s) and says which one is wrong", async () => {
    const create = vi.spyOn(organizationsApi, "create").mockResolvedValue(saved);
    render(<OrganizationForm onSaved={vi.fn()} />);
    fillRequired();
    fill("org-join", "javascript:alert(1)");

    fireEvent.click(screen.getByRole("button", { name: /Создать|Сохранить/ }));

    expect((await screen.findByRole("alert")).textContent).toContain("Форма вступления");
    expect(create).not.toHaveBeenCalled();
  });
});
