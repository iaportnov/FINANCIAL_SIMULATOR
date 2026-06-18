import { apiFetch } from "../../shared/api/client";

export interface TrainerTaskPublic {
  id: number;
  slug: string;
  title: string;
  instructions_md: string;
  sheet: { cells?: Record<string, { value?: unknown; formula?: string | null }> };
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

// --- AI tutor ---------------------------------------------------------------

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantReply {
  reply: string;
}

/** Ask the AI tutor about the current task; sends the chat so far + live cells. */
export const askAssistant = (taskId: number, messages: AssistantMessage[], cells: CellModel) =>
  apiFetch<AssistantReply>(`/trainer/${taskId}/assistant`, {
    method: "POST",
    body: JSON.stringify({ messages, cells }),
  });
