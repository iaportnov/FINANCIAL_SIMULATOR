import { create } from "zustand";

export interface User {
  id: number;
  email: string;
  display_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setSession: (accessToken: string, user: User) => void;
  setAccessToken: (accessToken: string | null) => void;
  clear: () => void;
}

/**
 * Session store. The access token lives in memory only (not localStorage);
 * the refresh token is an httpOnly cookie managed by the backend.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ user: null, accessToken: null }),
}));
