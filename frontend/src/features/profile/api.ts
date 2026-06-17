import { apiFetch } from "../../shared/api/client";
import type { User } from "../../shared/auth/store";

export const fetchMe = () => apiFetch<User>("/me");
