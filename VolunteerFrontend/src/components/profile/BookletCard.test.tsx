import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { bookletApi } from "../../api/booklet";
import { NotificationProvider } from "../../context/NotificationContext";
import type { BookletState } from "../../types/booklet";
import { BookletCard } from "./BookletCard";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", firstName: "Анна", lastName: "Петрова", middleName: null, birthYear: 2004, phoneNumber: "+37377712345" } }),
}));

const open: BookletState = { booklet: null, request: null, canRequest: true };
const request = (over = {}) => ({
  id: "r1", status: "Pending" as const, lastName: "Петрова", firstName: "Анна", middleName: null, birthYear: 2004, phone: "+37377712345",
  comment: null, hasPhoto: false, photoUrl: null, createdAt: "2026-06-01T12:00:00Z", handledAt: null, adminNote: null, bookletLabel: null, ...over,
});

const renderCard = () => render(<NotificationProvider><BookletCard /></NotificationProvider>);

beforeEach(() => { cleanup(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("BookletCard", () => {
  it("invites a volunteer who has no request, and 'learn more' explains the booklet and leads to the form", async () => {
    vi.spyOn(bookletApi, "state").mockResolvedValue(open);
    renderCard();

    expect(await screen.findByTestId("booklet-invite")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Узнать подробнее об оформлении/ }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Какие льготы и возможности даёт книжка")).toBeTruthy();
    expect(within(dialog).getByText("Какие данные мы собираем")).toBeTruthy();
    expect(within(dialog).getByText("Как получить")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Заполнить форму" }));
    expect(await screen.findByLabelText(/Фамилия/)).toBeTruthy();
  });

  it("the form starts with the profile data, asks for the phone and the consent and sends the request", async () => {
    vi.spyOn(bookletApi, "state").mockResolvedValue(open);
    const submit = vi.spyOn(bookletApi, "submit").mockResolvedValue(request());
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: "Заполнить форму" }));

    expect((screen.getByLabelText(/Фамилия/) as HTMLInputElement).value).toBe("Петрова");
    expect((screen.getByLabelText(/Год рождения/) as HTMLInputElement).value).toBe("2004");
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить заявку" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Укажите телефон");
    expect(submit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: "+373 777 12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить заявку" }));
    expect((await screen.findByRole("alert")).textContent).toContain("согласие");

    fireEvent.click(screen.getByRole("checkbox"));
    vi.spyOn(bookletApi, "state").mockResolvedValue({ booklet: null, request: request(), canRequest: false });
    fireEvent.click(screen.getByRole("button", { name: "Отправить заявку" }));

    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(submit.mock.calls[0][0]).toMatchObject({ lastName: "Петрова", firstName: "Анна", birthYear: 2004, phone: "+37377712345" });
  });

  it("rejects a year that is not a year", async () => {
    vi.spyOn(bookletApi, "state").mockResolvedValue(open);
    const submit = vi.spyOn(bookletApi, "submit").mockResolvedValue(request());
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: "Заполнить форму" }));

    fireEvent.change(screen.getByLabelText(/Год рождения/), { target: { value: "05" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Отправить заявку" }));

    expect((await screen.findByRole("alert")).textContent).toContain("год рождения");
    expect(submit).not.toHaveBeenCalled();
  });

  it("after the request the invitation is gone and one line of status stays", async () => {
    vi.spyOn(bookletApi, "state").mockResolvedValue({ booklet: null, request: request(), canRequest: false });
    renderCard();

    expect(await screen.findByTestId("booklet-pending")).toBeTruthy();
    expect(screen.queryByTestId("booklet-invite")).toBeNull();
    expect(screen.queryByRole("button", { name: "Заполнить форму" })).toBeNull();
    expect(screen.getByText(/не отправляйте форму ещё раз/)).toBeTruthy();
  });

  it("shows the number when the booklet is issued", async () => {
    vi.spyOn(bookletApi, "state").mockResolvedValue({
      booklet: { id: "b1", number: 414, label: "V-00414", lastName: "Петрова", firstName: "Анна", middleName: null, birthYear: 2004, issuedAt: "2026-11-20", hasPhoto: false, photoUrl: null, version: 1, createdAt: "2026-11-20T10:00:00Z", updatedAt: null },
      request: request({ status: "Issued" }), canRequest: false,
    });
    renderCard();

    expect(await screen.findByTestId("booklet-issued")).toBeTruthy();
    expect(screen.getByText("V-00414")).toBeTruthy();
    expect(screen.queryByTestId("booklet-invite")).toBeNull();
  });

  it("after a rejection the form opens again and says why", async () => {
    vi.spyOn(bookletApi, "state").mockResolvedValue({ booklet: null, request: request({ status: "Rejected", adminNote: "Неверный год рождения" }), canRequest: true });
    renderCard();

    expect(await screen.findByTestId("booklet-invite")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Неверный год рождения");
  });

  it("shows nothing when the state cannot be loaded: the profile works without the window", async () => {
    vi.spyOn(bookletApi, "state").mockRejectedValue(new Error("offline"));
    const { container } = renderCard();

    await waitFor(() => expect(bookletApi.state).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});
