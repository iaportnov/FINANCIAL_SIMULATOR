import { render, screen, waitFor } from "@testing-library/react";

import { useAuthStore } from "../shared/auth/store";
import { Providers } from "./providers";

function SessionProbe() {
  const user = useAuthStore((state) => state.user);
  return <div>{user ? user.display_name : "anonymous"}</div>;
}

describe("Providers", () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
    vi.restoreAllMocks();
  });

  it("restores the in-memory session from the refresh cookie before rendering children", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.endsWith("/api/v1/auth/refresh")) {
        return new Response(JSON.stringify({ access_token: "fresh-access", token_type: "bearer" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.endsWith("/api/v1/me")) {
        expect(init?.headers).toBeInstanceOf(Headers);
        expect((init?.headers as Headers).get("Authorization")).toBe("Bearer fresh-access");
        return new Response(
          JSON.stringify({
            id: 1,
            email: "learner@example.com",
            display_name: "Learner",
            role: "user",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <Providers>
        <SessionProbe />
      </Providers>,
    );

    expect(screen.queryByText("anonymous")).not.toBeInTheDocument();
    expect(await screen.findByText("Learner")).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBe("fresh-access");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/me",
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });
  });

  it("renders children as anonymous when the refresh cookie cannot restore a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: "unauthorized", message: "Missing refresh token" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(
      <Providers>
        <SessionProbe />
      </Providers>,
    );

    expect(await screen.findByText("anonymous")).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
