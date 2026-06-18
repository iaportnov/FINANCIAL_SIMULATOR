import { apiFetch } from "../api/client";
import { useAuthStore, type User } from "./store";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

let bootstrapSessionPromise: Promise<void> | null = null;

export function bootstrapSession(): Promise<void> {
  const state = useAuthStore.getState();
  if (state.accessToken && state.user) return Promise.resolve();
  if (bootstrapSessionPromise) return bootstrapSessionPromise;

  bootstrapSessionPromise = (async () => {
    try {
      const { access_token } = await apiFetch<TokenResponse>("/auth/refresh", { method: "POST" });
      useAuthStore.getState().setAccessToken(access_token);
      const user = await apiFetch<User>("/me");
      useAuthStore.getState().setSession(access_token, user);
    } catch {
      useAuthStore.getState().clear();
    } finally {
      bootstrapSessionPromise = null;
    }
  })();

  return bootstrapSessionPromise;
}
