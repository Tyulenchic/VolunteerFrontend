import { beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { FakeServer } from "../test/fakeServer";
import { getAccessToken, getRefreshToken, setTokens } from "../auth/session";

let server: FakeServer;
let auth: ReturnType<typeof useAuth>;

function Probe() {
  auth = useAuth();
  return <div data-testid="state">{auth.loading ? "loading" : auth.unavailable ? "unavailable" : auth.user ? "user:" + auth.user.email : "guest"}</div>;
}

const mount = () => render(<AuthProvider><Probe /></AuthProvider>);
const settled = async (expected: string) => waitFor(() => expect(screen.getByTestId("state").textContent).toBe(expected));

beforeEach(() => {
  cleanup();
  localStorage.clear();
  server = new FakeServer();
});

describe("session restoration on startup", () => {
  it("Case C: no tokens → guest, no network calls", async () => {
    mount();
    await settled("guest");
    expect(server.requestLog).toEqual([]);
  });

  it("Case A: valid access token → loads the user without refresh", async () => {
    setTokens("A1", "R1");
    mount();
    await settled("user:u@example.test");
    expect(server.refreshCalls.length).toBe(0);
  });

  it("Case A: expired access token + valid refresh token → one refresh, then the user is loaded", async () => {
    setTokens("A0-expired", "R1");
    mount();
    await settled("user:u@example.test");
    expect(server.refreshCalls).toEqual(["R1"]);
    expect(getAccessToken()).toBe("A2");
    expect(getRefreshToken()).toBe("R2");
  });

  it("Case B: refresh token but no access token → refresh first, then the user is loaded", async () => {
    localStorage.setItem("refreshToken", "R1");
    mount();
    await settled("user:u@example.test");
    expect(server.refreshCalls).toEqual(["R1"]);
    expect(server.requestLog).toEqual(["POST /api/auth/refresh", "GET /api/users/me"]);
    expect(getAccessToken()).toBe("A2");
  });

  it("Case D: invalid refresh token → session cleared, guest", async () => {
    localStorage.setItem("refreshToken", "R-revoked");
    mount();
    await settled("guest");
    expect(getRefreshToken()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("Case D: expired access + rejected refresh → session cleared, guest", async () => {
    setTokens("A0-expired", "R1");
    server.refreshMode = "reject401";
    mount();
    await settled("guest");
    expect(getRefreshToken()).toBeNull();
  });

  it.each(["status429", "status503", "network"] as const)("temporary refresh failure (%s) keeps the session and reports 'unavailable'", async (mode) => {
    localStorage.setItem("refreshToken", "R1");
    server.refreshMode = mode;
    mount();
    await settled("unavailable");
    expect(getRefreshToken()).toBe("R1");
  });

  it("recovers via retrySession once the server is back", async () => {
    localStorage.setItem("refreshToken", "R1");
    server.refreshMode = "status503";
    mount();
    await settled("unavailable");

    server.refreshMode = "rotate";
    await act(async () => { await auth.retrySession(); });
    await settled("user:u@example.test");
  });
});

describe("logout through the context", () => {
  it("makes the app unauthenticated even with an expired access token", async () => {
    setTokens("A1", "R1");
    mount();
    await settled("user:u@example.test");
    server.validAccess = "A-rotated-away"; // access стал недействителен

    await act(async () => { await auth.logout(); });

    await settled("guest");
    expect(server.logoutCalls).toEqual([{ refreshToken: "R1", authorization: undefined }]);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("a rejected refresh during normal use drops the user to guest", async () => {
    setTokens("A1", "R1");
    mount();
    await settled("user:u@example.test");

    server.validAccess = "A-other";
    server.refreshMode = "reject401";
    await act(async () => { await auth.refreshUser(); });

    await settled("guest");
  });
});
