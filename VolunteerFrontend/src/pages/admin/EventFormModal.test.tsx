import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NotificationProvider } from "../../context/NotificationContext";
import { adminApi } from "../../api/admin";
import { organizationsApi } from "../../api/organizations";
import { apiClient } from "../../api/client";
import { resetEventCategories } from "../../utils/eventCategories";
import { EventFormModal } from "./EventFormModal";

vi.mock("../../context/AuthContext", () => ({ useAuth: () => ({ isAdmin: true }) }));

const renderForm = () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  render(<NotificationProvider><EventFormModal isOpen onClose={onClose} onSuccess={onSuccess} /></NotificationProvider>);
  return { onSuccess, onClose };
};

const fillRequired = () => {
  fireEvent.change(document.querySelector("input[name=title]")!, { target: { value: "Уборка набережной" } });
  fireEvent.change(document.querySelector("textarea[name=description]")!, { target: { value: "Приходите помогать" } });
  fireEvent.change(document.querySelector("input[name=location]")!, { target: { value: "Набережная" } });
  fireEvent.change(document.querySelector("input[name=startsAt]")!, { target: { value: "2030-06-02T10:00" } });
  fireEvent.change(document.querySelector("input[name=endsAt]")!, { target: { value: "2030-06-02T14:00" } });
};

beforeEach(() => {
  cleanup();
  resetEventCategories([
    { value: "Ecological", label: "Экологическое", builtIn: true },
    { value: "Social", label: "Социальное", builtIn: true },
    { value: "custom-0123456789ab", label: "Помощь соседям", builtIn: false },
  ]);
  vi.spyOn(organizationsApi, "list").mockResolvedValue({ items: [], totalCount: 0, skip: 0, take: 100 } as never);
});
afterEach(() => { vi.restoreAllMocks(); });

describe("EventFormModal: category", () => {
  it("marks the category as required and does not save without it", async () => {
    const create = vi.spyOn(adminApi, "createEvent").mockResolvedValue({} as never);
    renderForm();
    expect(screen.getByText("Категория").parentElement?.textContent).toContain("*");

    fillRequired();
    fireEvent.click(screen.getByRole("button", { name: "Создать мероприятие" }));

    expect(await screen.findByText(/Выберите категорию мероприятия — это обязательное поле/)).toBeTruthy();
    expect(screen.getByLabelText(/Категория/).getAttribute("aria-invalid")).toBe("true");
    expect(create).not.toHaveBeenCalled();
  });

  it("offers the categories added by an administrator and sends the chosen one", async () => {
    const create = vi.spyOn(adminApi, "createEvent").mockResolvedValue({} as never);
    const { onSuccess } = renderForm();
    expect(screen.getByRole("option", { name: "Помощь соседям" })).toBeTruthy();

    fillRequired();
    fireEvent.change(screen.getByLabelText(/Категория/), { target: { value: "custom-0123456789ab" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать мероприятие" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ category: "custom-0123456789ab" });
    expect(create.mock.calls[0][0]).not.toHaveProperty("publishAt");
  });

  it("adds a new category with the plus button and selects it", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: { value: "custom-aaaaaaaaaaaa", label: "Субботники", builtIn: false } });
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: [
        { value: "Ecological", label: "Экологическое", builtIn: true },
        { value: "custom-aaaaaaaaaaaa", label: "Субботники", builtIn: false },
      ],
    });
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Добавить свою категорию" }));
    fireEvent.change(screen.getByLabelText("Название новой категории"), { target: { value: "Субботники" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    await waitFor(() => expect((screen.getByLabelText(/Категория/) as HTMLSelectElement).value).toBe("custom-aaaaaaaaaaaa"));
    expect(post).toHaveBeenCalledWith("/api/events/categories", { name: "Субботники" });
    expect(screen.queryByLabelText("Название новой категории")).toBeNull();
  });

  it("rejects a too short name of a new category without calling the server", () => {
    const post = vi.spyOn(apiClient, "post");
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Добавить свою категорию" }));
    fireEvent.change(screen.getByLabelText("Название новой категории"), { target: { value: "А" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    expect(screen.getByText(/не короче 2 символов/)).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });
});

describe("EventFormModal: scheduled publication", () => {
  it("sends the chosen time with a new event", async () => {
    const create = vi.spyOn(adminApi, "createEvent").mockResolvedValue({} as never);
    const { onSuccess } = renderForm();

    fillRequired();
    fireEvent.change(screen.getByLabelText(/Категория/), { target: { value: "Ecological" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Запланировать публикацию" }));
    fireEvent.change(screen.getByLabelText("Время публикации"), { target: { value: "2030-06-01T09:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать мероприятие" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(create.mock.calls[0][0].publishAt).toBe(new Date("2030-06-01T09:00").toISOString());
  });

  it("refuses a publication time after the end of the event", async () => {
    const create = vi.spyOn(adminApi, "createEvent").mockResolvedValue({} as never);
    renderForm();

    fillRequired();
    fireEvent.change(screen.getByLabelText(/Категория/), { target: { value: "Ecological" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Запланировать публикацию" }));
    fireEvent.change(screen.getByLabelText("Время публикации"), { target: { value: "2030-06-03T09:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать мероприятие" }));

    expect(await screen.findByText(/раньше окончания мероприятия/)).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });
});
