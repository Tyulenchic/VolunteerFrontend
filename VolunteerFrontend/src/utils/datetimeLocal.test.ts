import { describe, expect, it } from "vitest";
import { fromDatetimeLocal, toDatetimeLocal } from "./datetimeLocal";

describe("datetime-local conversion", () => {
  it("round-trips a moment through the field value", () => {
    const iso = "2026-06-02T10:30:00.000Z";
    expect(fromDatetimeLocal(toDatetimeLocal(iso))).toBe(iso);
  });

  it("gives empty values for empty or invalid input", () => {
    expect(toDatetimeLocal(null)).toBe("");
    expect(toDatetimeLocal("")).toBe("");
    expect(toDatetimeLocal("not a date")).toBe("");
    expect(fromDatetimeLocal("")).toBeNull();
    expect(fromDatetimeLocal("not a date")).toBeNull();
  });

  it("formats the field value in the local time zone without seconds", () => {
    expect(toDatetimeLocal("2026-06-02T10:30:45Z")).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
