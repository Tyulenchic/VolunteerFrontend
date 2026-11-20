import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { organizationsApi } from "../../api/organizations";
import type { OrganizationDetails } from "../../types/organization";
import { OrganizationForm } from "./OrganizationForm";

const auth = vi.hoisted(() => ({ isAdmin: true }));
vi.mock("../../context/AuthContext", () => ({ useAuth: () => ({ isAdmin: auth.isAdmin }) }));

const saved = { id: "o1", name: "Экодобро" } as OrganizationDetails;

const fill = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
const fillRequired = () => {
  fill("org-name", "Экодобро");
  fireEvent.change(document.getElementById("org-desc") as HTMLTextAreaElement, { target: { value: "Помогаем природе" } });
};
const submit = () => fireEvent.click(screen.getByRole("button", { name: /Создать|Сохранить/ }));

beforeEach(() => {
  cleanup();
  auth.isAdmin = true;
  vi.spyOn(organizationsApi, "customCategories").mockResolvedValue([]);
});
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

    submit();

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

    submit();

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ address: null, facebookUrl: null, telegramUrl: null, instagramUrl: null, vkUrl: null, joinFormUrl: null, customCategories: [] });
  });

  it("does not send a link that is not http(s) and says which one is wrong", async () => {
    const create = vi.spyOn(organizationsApi, "create").mockResolvedValue(saved);
    render(<OrganizationForm onSaved={vi.fn()} />);
    fillRequired();
    fill("org-join", "javascript:alert(1)");

    submit();

    expect((await screen.findByRole("alert")).textContent).toContain("Форма вступления");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("OrganizationForm: own categories", () => {
  it("the administrator adds a category with the plus button and it is chosen right away", async () => {
    const createCategory = vi.spyOn(organizationsApi, "createCategory").mockResolvedValue({ code: "custom-0123456789ab", name: "Помощь соседям" });
    const create = vi.spyOn(organizationsApi, "create").mockResolvedValue(saved);
    render(<OrganizationForm onSaved={vi.fn()} />);
    fillRequired();

    fireEvent.click(screen.getByRole("button", { name: "Добавить своё направление" }));
    const input = screen.getByLabelText("Название нового направления");
    fireEvent.change(input, { target: { value: "  Помощь   соседям " } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(createCategory).toHaveBeenCalledWith("Помощь соседям"));
    expect(await screen.findByRole("button", { name: "Помощь соседям", pressed: true })).toBeTruthy();
    submit();

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].customCategories).toEqual(["custom-0123456789ab"]);
  });

  it("shows the categories that exist and lets an organizer pick them but not add new ones", async () => {
    auth.isAdmin = false;
    vi.spyOn(organizationsApi, "customCategories").mockResolvedValue([{ code: "custom-aaaaaaaaaaaa", name: "Донорство" }]);
    const create = vi.spyOn(organizationsApi, "create").mockResolvedValue(saved);
    render(<OrganizationForm onSaved={vi.fn()} />);
    fillRequired();

    expect(screen.queryByRole("button", { name: "Добавить своё направление" })).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: "Донорство" }));
    submit();

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].customCategories).toEqual(["custom-aaaaaaaaaaaa"]);
  });

  it("explains a refusal of the server and keeps the typed name", async () => {
    vi.spyOn(organizationsApi, "createCategory").mockRejectedValue(new AxiosError("conflict", "ERR_BAD_REQUEST", undefined, undefined, { status: 409, statusText: "Conflict", headers: {}, config: {} as never, data: { error: "Категория «Спорт» уже есть в списке." } }));
    render(<OrganizationForm onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Добавить своё направление" }));
    const input = screen.getByLabelText("Название нового направления");
    fireEvent.change(input, { target: { value: "Спорт" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText(/уже есть в списке/)).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe("Спорт");
  });
});
