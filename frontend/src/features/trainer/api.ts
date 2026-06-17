import { apiFetch } from "../../shared/api/client";

export interface TrainerTaskPublic {
  id: number;
  slug: string;
  title: string;
  instructions_md: string;
  sheet: { cells?: Record<string, { value?: unknown }> };
  editable: string[];
}

/** Neutral cell model sent on submit: A1 -> { value, formula }. */
export type CellModel = Record<string, { value: unknown; formula: string | null }>;

export interface CellResult {
  cell: string;
  correct: boolean;
}

export interface TrainerResult {
  passed: boolean;
  results: CellResult[];
}

export const fetchTask = (taskId: number) => apiFetch<TrainerTaskPublic>(`/trainer/${taskId}`);

export const submitTask = (taskId: number, cells: CellModel) =>
  apiFetch<TrainerResult>(`/trainer/${taskId}/submit`, {
    method: "POST",
    body: JSON.stringify({ cells }),
  });
