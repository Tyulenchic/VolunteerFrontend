import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { feedbackApi } from "../api/feedback";
import { announceFeedbackRead, useFeedbackUnread } from "./feedbackUnread";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("useFeedbackUnread", () => {
  it("shows the count of the signed-in administrator and refreshes it after a message is read", async () => {
    const unread = vi.spyOn(feedbackApi, "unreadCount").mockResolvedValue({ unreadCount: 3 });
    const { result } = renderHook(() => useFeedbackUnread(true));
    await waitFor(() => expect(result.current).toBe(3));

    unread.mockResolvedValue({ unreadCount: 2 });
    act(() => announceFeedbackRead());

    await waitFor(() => expect(result.current).toBe(2));
  });

  it("does not ask the server outside the administrator panel", () => {
    const unread = vi.spyOn(feedbackApi, "unreadCount").mockResolvedValue({ unreadCount: 5 });
    const { result } = renderHook(() => useFeedbackUnread(false));

    expect(result.current).toBe(0);
    expect(unread).not.toHaveBeenCalled();
  });

  it("keeps the previous number when the request fails", async () => {
    const unread = vi.spyOn(feedbackApi, "unreadCount").mockResolvedValue({ unreadCount: 4 });
    const { result } = renderHook(() => useFeedbackUnread(true));
    await waitFor(() => expect(result.current).toBe(4));

    unread.mockRejectedValue(new Error("offline"));
    act(() => announceFeedbackRead());
    await waitFor(() => expect(unread).toHaveBeenCalledTimes(2));

    expect(result.current).toBe(4);
  });
});
