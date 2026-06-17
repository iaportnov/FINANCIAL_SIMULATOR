import { apiFetch } from "../../shared/api/client";

export type StepStatus = "locked" | "unlocked" | "completed";

export interface StepNode {
  id: number;
  title: string;
  activity_type: "lesson" | "quiz" | "trainer_task";
  activity_id: number;
  status: StepStatus;
}

export interface BlockNode {
  id: number;
  title: string;
  xp_reward: number;
  steps: StepNode[];
}

export interface CourseNode {
  id: number;
  slug: string;
  title: string;
  blocks: BlockNode[];
}

export interface MapResponse {
  level: number;
  total_xp: number;
  courses: CourseNode[];
}

export interface ProgressSummary {
  level: number;
  total_xp: number;
}

export const fetchMap = () => apiFetch<MapResponse>("/progression/map");

export const fetchProgress = () => apiFetch<ProgressSummary>("/progression/me");

export const completeStep = (stepId: number) =>
  apiFetch<ProgressSummary>(`/progression/steps/${stepId}/complete`, { method: "POST" });
