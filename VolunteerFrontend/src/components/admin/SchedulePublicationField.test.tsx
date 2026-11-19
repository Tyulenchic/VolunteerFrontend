import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SchedulePublicationField } from "./SchedulePublicationField";

beforeEach(() => { cleanup(); });

describe("SchedulePublicationField", () => {
  it("is off by default and explains that a draft stays hidden", () => {
    render(<SchedulePublicationField value="" onChange={vi.fn()} subject="Новость" />);
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByLabelText("Время публикации")).toBeNull();
    expect(screen.getByText(/остаётся скрытым/)).toBeTruthy();
  });

  it("proposes a time in the future when switched on", () => {
    const onChange = vi.fn();
    render(<SchedulePublicationField value="" onChange={onChange} subject="Новость" />);
    fireEvent.click(screen.getByRole("checkbox"));

    const proposed = onChange.mock.calls[0][0] as string;
    expect(proposed).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:00$/);
    expect(new Date(proposed).getTime()).toBeGreaterThan(Date.now());
  });

  it("shows the chosen time and clears the schedule when switched off", () => {
    const onChange = vi.fn();
    render(<SchedulePublicationField value="2030-01-01T10:00" onChange={onChange} subject="Мероприятие" />);
    expect((screen.getByLabelText("Время публикации") as HTMLInputElement).value).toBe("2030-01-01T10:00");
    expect(screen.getByText(/Мероприятие сохранится как черновик/)).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
