import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { adminApi } from "./admin";

afterEach(() => { vi.restoreAllMocks(); });

describe("adminApi.blockUser", () => {
  it("sends the reason when there is one, trimmed", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: {} });
    await adminApi.blockUser("u1", "  Спам в комментариях ");
    expect(post).toHaveBeenCalledWith("/api/admin/users/u1/block", { reason: "Спам в комментариях" });
  });

  it("sends no reason at all when it is empty: the person gets the standard text", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: {} });
    await adminApi.blockUser("u1", "   ");
    await adminApi.blockUser("u2");
    expect(post.mock.calls).toEqual([["/api/admin/users/u1/block", {}], ["/api/admin/users/u2/block", {}]]);
  });
});
