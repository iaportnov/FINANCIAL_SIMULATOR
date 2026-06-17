import { useAuthStore } from "../auth/store";

const BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Thin typed fetch wrapper. Attaches the in-memory access token, sends cookies
 * (for the httpOnly refresh token), and unwraps the unified error envelope.
 *
 * NOTE: response types are hand-written in each feature's api.ts for now; once
 * the backend is running, `npm run generate:types` produces src/shared/api/schema.d.ts
 * from OpenAPI and those should become the source of truth.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let code = "http_error";
    let message = res.statusText;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
    } catch {
      // non-JSON error body; keep defaults
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
