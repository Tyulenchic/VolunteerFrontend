import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { imagesApi } from "../../api/images";
import { Thumb } from "./Avatar";

const ID = "22222222-2222-2222-2222-222222222222";
const THUMB = `/api/images/${ID}/thumbnail`;

beforeEach(() => {
  cleanup();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:draft"), revokeObjectURL: vi.fn() }));
});
afterEach(() => { vi.restoreAllMocks(); });

describe("Thumb", () => {
  it("shows a draft image that is not public by asking for it with the token", async () => {
    const preview = vi.spyOn(imagesApi, "preview").mockResolvedValue(new Blob(["x"]));
    const { container } = render(<Thumb src={THUMB} className="w-28" />);

    fireEvent.error(container.querySelector("img")!);

    await waitFor(() => expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:draft"));
    expect(preview).toHaveBeenCalledWith(ID, true);
  });

  it("falls back to the placeholder when the image cannot be shown at all", async () => {
    vi.spyOn(imagesApi, "preview").mockRejectedValue(new Error("404"));
    const { container } = render(<Thumb src={THUMB} />);

    fireEvent.error(container.querySelector("img")!);

    await waitFor(() => expect(container.querySelector("img")).toBeNull());
    expect(container.querySelector(".fa-image")).not.toBeNull();
  });

  it("shows the placeholder without an address", () => {
    const { container } = render(<Thumb src={null} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".fa-image")).not.toBeNull();
  });
});
