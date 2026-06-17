import { apiFetch } from "../../shared/api/client";
import type { User } from "../../shared/auth/store";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const register = (email: string, password: string, display_name: string) =>
  apiFetch<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name }),
  });

export const login = (email: string, password: string) =>
  apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const fetchMe = () => apiFetch<User>("/me");

export const logout = () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
